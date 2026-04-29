import Phaser from "phaser";
import { playerAttack, enemyAttack } from "../systems/CombatSystem.js";

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
    this.enemy = null;
    this.playerHpText = null;
    this.enemyHpText = null;
    this.logText = null;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    const dataStore = this.registry.get("dataStore");
    this.runState = this.registry.get("runState");

    const player = this.runState?.player;
    const selectedClassId = player?.classId || "rogue";

    const wave = getNextBattleWave(this.runState, dataStore);
const enemies = buildEnemiesForWave(wave, dataStore);

this.enemy = enemies[0];

if (!this.enemy) {
  this.scene.start("HallwayScene");
  return;
};

    this.add.image(width / 2, height / 2, "bg_depth_1").setDisplaySize(width, height);

    const playerBase = getPlayerSpriteBase(selectedClassId);

    this.playerSprite = this.add.image(width * 0.75, height * 0.82, `${playerBase}_idle`);
    this.playerSprite.setOrigin(0.5, 1);
    this.playerSprite.setScale(2);

    this.enemySprite = this.add.image(width * 0.28, height * 0.82, `${this.enemy.spritePrefix}_idle`);
    this.enemySprite.setOrigin(0.5, 1);
    this.enemySprite.setScale(1.7);

    this.add.text(width / 2, 44, "LEVEL 1  WAVE 1", {
      fontFamily: "Georgia",
      fontSize: "28px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(width * 0.28, height * 0.17, this.enemy.name, {
      fontFamily: "Georgia",
      fontSize: "25px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5);

    this.enemyHpText = this.add.text(width * 0.28, height * 0.23, "", {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: "#c9b56d",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

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

    this.logText = this.add.text(width / 2, height * 0.92, "Battle started. Your turn.", {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
      wordWrap: { width: 860 },
      align: "center"
    }).setOrigin(0.5);

    this.refreshHud();
  }

  refreshHud() {
    const player = this.runState.player;

    this.playerHpText.setText(
      `HP ${player.hp}/${player.maxHp}  ATK ${player.attackMultiplier}  SPD ${player.speed}  CRIT ${player.crit}%`
    );

    this.enemyHpText.setText(`HP ${this.enemy.currentHp}/${this.enemy.hp}`);
  }

  handlePlayerAttack() {
    if (!this.enemy || this.enemy.currentHp <= 0) return;
    if (!this.runState?.player || this.runState.player.hp <= 0) return;

    const playerResult = playerAttack(this.runState, this.enemy);

    if (playerResult.enemyDefeated) {
      this.enemySprite.setAlpha(0.45);
      this.logText.setText(`You dealt ${playerResult.damage}. ${this.enemy.name} defeated.`);
      this.refreshHud();

      this.time.delayedCall(900, () => {
  advancePastCurrentBattle(this.runState);
  this.registry.set("runState", this.runState);
  this.scene.start("HallwayScene");
});

      return;
    }

    const enemyResult = enemyAttack(this.runState, this.enemy);

    if (enemyResult.playerDefeated) {
      this.playerSprite.setAlpha(0.45);
      this.logText.setText(`You dealt ${playerResult.damage}. ${this.enemy.name} hit you for ${enemyResult.damage}. You fell.`);
      this.refreshHud();
      return;
    }

    this.logText.setText(
      `You dealt ${playerResult.damage}. ${this.enemy.name} hit you for ${enemyResult.damage}.`
    );

    this.registry.set("runState", this.runState);
    this.refreshHud();
  }
}
