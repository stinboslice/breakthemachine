import Phaser from "phaser";
import { playerAttack, enemyAttack } from "../systems/CombatSystem.js";
import {
  getNextBattleWave,
  buildEnemiesForWave
} from "../systems/WaveSystem.js";
import {
  finishBattleWave,
  shouldShowBossDoor
} from "../systems/RouteSystem.js";

function getPlayerSpriteBase(classId) {
  if (classId === "rogue") return "player_rogue";
  if (classId === "vanguard") return "player_vanguard";
  if (classId === "berserker") return "player_berserker";
  return "player_rogue";
}

export class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");

    this.runState = null;
    this.enemies = [];
    this.enemySprites = [];
    this.playerHpText = null;
    this.enemyHpText = null;
    this.logText = null;
    this.turnQueue = [];
    this.turnIndex = 0;
    this.round = 1;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    const dataStore = this.registry.get("dataStore");
    this.runState = this.registry.get("runState");

    const player = this.runState?.player;
    const selectedClassId = player?.classId || "rogue";

    const wave = getNextBattleWave(this.runState, dataStore);
    this.enemies = buildEnemiesForWave(wave, dataStore);

    if (!this.enemies.length) {
      this.scene.start("HallwayScene");
      return;
    }

    this.add.image(width / 2, height / 2, "bg_depth_1").setDisplaySize(width, height);

    const playerBase = getPlayerSpriteBase(selectedClassId);

    this.playerSprite = this.add.image(width * 0.75, height * 0.82, `${playerBase}_idle`);
    this.playerSprite.setOrigin(0.5, 1);
    this.playerSprite.setScale(2);

    this.add.text(width / 2, 44, `LEVEL ${(this.runState.levelIndex || 0) + 1}  ROUND ${this.round}`, {
      fontFamily: "Georgia",
      fontSize: "28px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5);

    this.drawEnemies(width, height);

    this.add.text(width * 0.75, height * 0.15, `${player.characterName} | ${player.className}`, {
      fontFamily: "Georgia",
      fontSize: "22px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.playerHpText = this.add.text(width * 0.75, height * 0.21, "", {
      fontFamily: "Georgia",
      fontSize: "16px",
      color: "#c9b56d",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5);

    const attackButton = this.add.text(width / 2, height * 0.82, "ATTACK", {
      fontFamily: "Georgia",
      fontSize: "24px",
      color: "#ffffff",
      backgroundColor: "#7b1113",
      padding: { x: 32, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    attackButton.on("pointerdown", () => this.handlePlayerAttack());

    this.logText = this.add.text(width / 2, height * 0.92, "Battle started.", {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
      wordWrap: { width: 860 },
      align: "center"
    }).setOrigin(0.5);

    this.refreshHud();
    this.buildTurnQueue();
    this.processTurn();
  }

  drawEnemies(width, height) {
    this.enemySprites = [];

    const startX = width * 0.20;
    const spacing = 145;

    this.enemies.forEach((enemy, index) => {
      const x = startX + index * spacing;
      const y = height * 0.82;

      const sprite = this.add.image(x, y, `${enemy.spritePrefix}_idle`);
      sprite.setOrigin(0.5, 1);
      sprite.setScale(enemy.role === "miniboss" ? 1.55 : 1.35);

      const nameText = this.add.text(x, height * 0.16, enemy.name, {
        fontFamily: "Georgia",
        fontSize: "20px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5);

      const hpText = this.add.text(x, height * 0.21, "", {
        fontFamily: "Georgia",
        fontSize: "15px",
        color: "#c9b56d",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(0.5);

      this.enemySprites.push({ enemy, sprite, nameText, hpText });
    });
  }

  refreshHud() {
    const player = this.runState.player;

    this.playerHpText.setText(
      `HP ${player.hp}/${player.maxHp}  ATK ${player.attackMultiplier}  SPD ${player.speed}  CRIT ${player.crit}%`
    );

    this.enemySprites.forEach(group => {
      group.hpText.setText(`HP ${group.enemy.currentHp}/${group.enemy.hp}`);
      group.sprite.setAlpha(group.enemy.currentHp > 0 ? 1 : 0.45);
    });

    this.registry.set("runState", this.runState);
  }

  buildTurnQueue() {
    const player = this.runState.player;
    const livingEnemies = this.enemies.filter(enemy => enemy.currentHp > 0);

    this.turnQueue = [
      {
        type: "player",
        initiative: this.rollInitiative(player.speed)
      },
      ...livingEnemies.map(enemy => ({
        type: "enemy",
        enemy,
        initiative: this.rollInitiative(enemy.speed)
      }))
    ];

    this.turnQueue.sort((a, b) => b.initiative - a.initiative);
    this.turnIndex = 0;
  }

  rollInitiative(speed) {
    return speed * (0.85 + Math.random() * 0.3);
  }

  processTurn() {
    if (this.runState.player.hp <= 0) {
      this.logText.setText("You died.");
      this.refreshHud();
      return;
    }

    const livingEnemies = this.enemies.filter(enemy => enemy.currentHp > 0);

    if (!livingEnemies.length) {
      this.handleVictory();
      return;
    }

    const unit = this.turnQueue[this.turnIndex];

    if (!unit) return;

    if (unit.type === "player") {
      this.logText.setText("Your turn.");
      this.refreshHud();
      return;
    }

    const result = enemyAttack(this.runState, unit.enemy);

    this.logText.setText(`${unit.enemy.name} hits you for ${result.damage}.`);
    this.refreshHud();

    this.time.delayedCall(650, () => {
      this.nextTurn();
    });
  }

  handlePlayerAttack() {
    const unit = this.turnQueue[this.turnIndex];

    if (!unit || unit.type !== "player") return;

    const target = this.enemies.find(enemy => enemy.currentHp > 0);
    if (!target) return;

    const result = playerAttack(this.runState, target);

    this.logText.setText(`You hit ${target.name} for ${result.damage}.`);
    this.refreshHud();

    if (result.enemyDefeated) {
      this.logText.setText(`You dealt ${result.damage}. ${target.name} defeated.`);
    }

    this.time.delayedCall(450, () => {
      this.nextTurn();
    });
  }

  nextTurn() {
    this.turnIndex += 1;

    if (this.turnIndex >= this.turnQueue.length) {
      this.round += 1;
      this.buildTurnQueue();
    }

    this.processTurn();
  }

  handleVictory() {
  this.logText.setText("Wave cleared.");

  this.time.delayedCall(800, () => {
    const dataStore = this.registry.get("dataStore") || window.ELF_DATASTORE;

    const result = finishBattleWave(this.runState);
    this.runState = result.runState;

    this.registry.set("runState", this.runState);

    if (result.nextScene === "HallwayScene" && shouldShowBossDoor(this.runState, dataStore)) {
      this.scene.start("BossDoorScene");
      return;
    }

    this.scene.start(result.nextScene);
  });
}
}
