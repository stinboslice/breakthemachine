import Phaser from "phaser";
import { playerAttack, enemyAttack } from "../systems/CombatSystem.js";
import {
  getWaveAtCurrentIndex,
  getBossBattleWave,
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
this.selectedEnemyIndex = 0;
this.targetText = null;
this.specialButton = null;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    const dataStore = this.registry.get("dataStore");
    this.runState = this.registry.get("runState");

    const player = this.runState?.player;
    const selectedClassId = player?.classId || "rogue";

    const wave = this.runState.forceBoss
  ? getBossBattleWave(this.runState, dataStore)
  : getWaveAtCurrentIndex(this.runState, dataStore);

this.enemies = buildEnemiesForWave(wave, dataStore);

    if (!this.enemies.length) {
      this.scene.start("HallwayScene");
      return;
    }

    this.add.image(width / 2, height / 2, "bg_depth_1").setDisplaySize(width, height);

    const playerBase = getPlayerSpriteBase(selectedClassId);

    this.playerSprite = this.add.image(width * 0.75, height * 0.82, `${playerBase}_idle`);
    this.playerSprite.setOrigin(0.5, 1);
    this.playerSprite.setScale(1.15);

    this.add.text(width / 2, 44, `LEVEL ${(this.runState.levelIndex || 0) + 1}  BATTLE`, {
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

this.specialButton = this.add.text(width / 2, height * 0.89, "SPECIAL", {
  fontFamily: "Georgia",
  fontSize: "20px",
  color: "#ffffff",
  backgroundColor: "#1b3a5a",
  padding: { x: 28, y: 10 }
}).setOrigin(0.5).setInteractive({ useHandCursor: true });

this.specialButton.on("pointerdown", () => this.handleSpecialAttack());

this.targetText = this.add.text(width / 2, height * 0.955, "TARGET: AUTO", {
  fontFamily: "Georgia",
  fontSize: "15px",
  color: "#c9b56d",
  stroke: "#000000",
  strokeThickness: 3
}).setOrigin(0.5);

    this.logText = this.add.text(width / 2, height * 0.835, "Battle started.", {
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
sprite.setScale(enemy.role === "miniboss" ? 1.05 : 0.85);
sprite.setInteractive({ useHandCursor: true });

sprite.on("pointerdown", () => {
  if (enemy.currentHp <= 0) return;
  this.selectedEnemyIndex = index;
  this.updateTargetSelection();
});

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

this.updateTargetSelection();

if (this.specialButton) {
  const uses = this.runState.player.specialUsesRemaining || 0;
  this.specialButton.setText(`SPECIAL ${uses}`);
  this.specialButton.setAlpha(uses > 0 ? 1 : 0.45);
}

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
    this.handlePlayerDeath();
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

    this.animateEnemyAttack(unit.enemy);

  }
handlePlayerDeath() {
  if (this.deathHandled) return;
  this.deathHandled = true;

  this.logText.setText("You were destroyed.");

  // disable input
  this.input.enabled = false;

  // swap sprite to down state
  const classId = this.runState.player.classId;
  this.playerSprite.setTexture(`player_${classId}_down`);

  // slow motion effect
  this.time.timeScale = 0.35;

  // screen shake
  this.cameras.main.shake(600, 0.01);

  // slight delay then go to game over
  this.time.delayedCall(1200, () => {
    this.time.timeScale = 1;
    this.scene.start("GameOverScene");
  });
}

getEnemyFrameKey(enemy, frame) {
  const key = `${enemy.spritePrefix}_${frame}`;

  if (this.textures.exists(key)) {
    return key;
  }

  return `${enemy.spritePrefix}_idle`;
}

getSelectedTarget() {
  const livingEnemies = this.enemies.filter(enemy => enemy.currentHp > 0);

  if (!livingEnemies.length) return null;

  const selected = this.enemies[this.selectedEnemyIndex];

  if (selected && selected.currentHp > 0) {
    return selected;
  }

  this.selectedEnemyIndex = this.enemies.findIndex(enemy => enemy.currentHp > 0);
  return this.enemies[this.selectedEnemyIndex] || livingEnemies[0];
}

updateTargetSelection() {
  this.enemySprites.forEach((group, index) => {
    const isSelected =
      index === this.selectedEnemyIndex &&
      group.enemy.currentHp > 0;

    group.sprite.setTint(isSelected ? 0xfff0a8 : 0xffffff);
    group.nameText.setColor(isSelected ? "#fff0a8" : "#f4e7c1");
  });

  const target = this.getSelectedTarget();

  if (this.targetText) {
    this.targetText.setText(target ? `TARGET: ${target.name}` : "TARGET: NONE");
  }
}
  
animatePlayerBasicAttack(target, onImpact) {
  const player = this.runState.player;
  const originalX = this.playerSprite.x;
  const originalY = this.playerSprite.y;
  const targetGroup = this.enemySprites.find(group => group.enemy === target);

  if (!targetGroup) {
    onImpact();
    return;
  }

  this.tweens.add({
    targets: this.playerSprite,
    x: originalX - 95,
    duration: 110,
    onComplete: () => {
      this.cameras.main.shake(160, 0.006);

      const fx = this.add.image(
        targetGroup.sprite.x,
        targetGroup.sprite.y - 70,
        "fx_slash_purple"
      );

      fx.setScale(0.9);
      fx.setDepth(50);

      this.tweens.add({
        targets: fx,
        alpha: 0,
        scale: 1.25,
        duration: 220,
        onComplete: () => fx.destroy()
      });

      onImpact();

      this.time.delayedCall(140, () => {
        this.playerSprite.setPosition(originalX, originalY);
        this.playerSprite.setTexture(`${getPlayerSpriteBase(player.classId)}_idle`);
      });
    }
  });
}

  handlePlayerAttack() {
  const unit = this.turnQueue[this.turnIndex];
  if (!unit || unit.type !== "player") return;

  const target = this.getSelectedTarget();
  if (!target) return;

  const player = this.runState.player;
  const base = getPlayerSpriteBase(player.classId);

  const originalX = this.playerSprite.x;
  const targetGroup = this.enemySprites.find(g => g.enemy === target);

  // DASH IN
  this.playerSprite.setTexture(`${base}_dash`);

  this.tweens.add({
    targets: this.playerSprite,
    x: originalX - 90,
    duration: 140,

    onComplete: () => {

      // WINDUP if exists
      const windupKey = `${base}_windup`;
      if (this.textures.exists(windupKey)) {
        this.playerSprite.setTexture(windupKey);
      }

      this.time.delayedCall(120, () => {

        // STRIKE FRAME
        this.playerSprite.setTexture(`${base}_light`);

        this.cameras.main.shake(180, 0.006);

        if (targetGroup) {
          targetGroup.sprite.setTexture(this.getEnemyFrameKey(target, "hit"));

          const fx = this.add.image(
            targetGroup.sprite.x,
            targetGroup.sprite.y - 70,
            "fx_slash_purple"
          );

          fx.setScale(1.0);
          fx.setDepth(50);

          this.tweens.add({
            targets: fx,
            alpha: 0,
            scale: 1.3,
            duration: 250,
            onComplete: () => fx.destroy()
          });
        }

        // APPLY DAMAGE HERE ONLY
        const result = playerAttack(this.runState, target);

        this.logText.setText(`You hit ${target.name} for ${result.damage}.`);

        // DEATH HANDLING
        if (result.enemyDefeated) {
          if (targetGroup) {
            targetGroup.sprite.setTexture(this.getEnemyFrameKey(target, "down"));

            this.tweens.add({
              targets: targetGroup.sprite,
              alpha: 0,
              duration: 700,
              delay: 300
            });
          }

          this.selectedEnemyIndex = this.enemies.findIndex(e => e.currentHp > 0);
        }

        this.refreshHud();

        // RETURN TO IDLE
        this.time.delayedCall(220, () => {
          this.playerSprite.setTexture(`${base}_idle`);
          this.playerSprite.x = originalX;
        });

        // NEXT TURN
        this.time.delayedCall(700, () => {
          this.nextTurn();
        });
      });
    }
  });
}

handleSpecialAttack() {
  const unit = this.turnQueue[this.turnIndex];

  if (!unit || unit.type !== "player") return;

  const player = this.runState.player;

  if (!player.specialUsesRemaining || player.specialUsesRemaining <= 0) {
    this.logText.setText("No special uses remaining.");
    return;
  }

  const target = this.getSelectedTarget();
  if (!target) return;

  player.specialUsesRemaining -= 1;

  const originalX = this.playerSprite.x;
  const originalY = this.playerSprite.y;
  const targetGroup = this.enemySprites.find(group => group.enemy === target);

  this.tweens.add({
    targets: this.playerSprite,
    x: originalX - 140,
    duration: 120,
    onComplete: () => {
      this.playerSprite.setTexture(`player_${player.classId}_special`);

      this.cameras.main.shake(250, 0.012);
      this.cameras.main.flash(140, 255, 255, 255);

      if (targetGroup) {
        const fx = this.add.image(
          targetGroup.sprite.x,
          targetGroup.sprite.y - 80,
          "fx_burst_purple"
        );

        fx.setScale(1.15);
        fx.setDepth(50);

        this.tweens.add({
          targets: fx,
          alpha: 0,
          scale: 1.7,
          duration: 300,
          onComplete: () => fx.destroy()
        });
      }

      const result = playerAttack(this.runState, target, { isSpecial: true });

      this.logText.setText(`SPECIAL hit ${target.name} for ${result.damage}.`);

      if (result.enemyDefeated) {
  const targetGroup = this.enemySprites.find(group => group.enemy === target);

  if (targetGroup) {
    targetGroup.sprite.setTexture(this.getEnemyFrameKey(target, "down"));
    targetGroup.sprite.clearTint();

    this.cameras.main.shake(300, 0.01);

    this.tweens.add({
      targets: targetGroup.sprite,
      alpha: 0,
      duration: 700,
      delay: 500
    });
  }

  this.selectedEnemyIndex = this.enemies.findIndex(enemy => enemy.currentHp > 0);
  this.logText.setText(`SPECIAL dealt ${result.damage}. ${target.name} defeated.`);
}

      this.refreshHud();

      this.time.delayedCall(180, () => {
        this.playerSprite.setTexture(`${getPlayerSpriteBase(player.classId)}_idle`);
        this.playerSprite.setPosition(originalX, originalY);
      });

      this.time.delayedCall(460, () => {
        this.nextTurn();
      });
    }
  });
}

animateEnemyAttack(enemy) {
  const player = this.runState.player;
  const playerBase = getPlayerSpriteBase(player.classId);

  const enemyGroup = this.enemySprites.find(g => g.enemy === enemy);
  if (!enemyGroup) return;

  const originalX = enemyGroup.sprite.x;

  // DASH
  enemyGroup.sprite.setTexture(this.getEnemyFrameKey(enemy, "dash"));

  this.tweens.add({
    targets: enemyGroup.sprite,
    x: originalX + 60,
    duration: 140,

    onComplete: () => {

      // WINDUP if exists
      const windupKey = this.getEnemyFrameKey(enemy, "windup");
      if (this.textures.exists(windupKey)) {
        enemyGroup.sprite.setTexture(windupKey);
      }

      this.time.delayedCall(120, () => {

        // STRIKE
        let strikeKey = `${enemy.spritePrefix}_attack`;

if (!this.textures.exists(strikeKey)) {
  strikeKey = `${enemy.spritePrefix}_strike`;
}

if (!this.textures.exists(strikeKey)) {
  strikeKey = `${enemy.spritePrefix}_dash`;
}

enemyGroup.sprite.setTexture(strikeKey);

        this.cameras.main.shake(180, 0.006);

        this.playerSprite.setTexture(`${playerBase}_hit`);

        const result = enemyAttack(this.runState, enemy);

        this.logText.setText(`${enemy.name} hits you for ${result.damage}.`);

        this.refreshHud();

        // RETURN
        this.time.delayedCall(200, () => {
          enemyGroup.sprite.setTexture(this.getEnemyFrameKey(enemy, "idle"));
          enemyGroup.sprite.x = originalX;

          this.playerSprite.setTexture(`${playerBase}_idle`);
        });

        this.time.delayedCall(650, () => {
          this.nextTurn();
        });
      });
    }
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
if (this.runState.forceBoss) {
  this.runState.forceBoss = false;
  this.runState.bossCleared = true;

  this.registry.set("runState", this.runState);

  this.logText.setText("Boss cleared.");

  this.time.delayedCall(800, () => {
    this.scene.start("LevelCompleteScene");
  });

  return;
}
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
