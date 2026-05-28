import Phaser from "phaser";
import { playMusic } from "../systems/AudioManager.js";
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
this.actionLocked = false;
this.playerBobTween = null;
this.playerGroundY = 0;
  }

  create() {
    const width = this.scale.width;
const height = this.scale.height;

this.deathHandled = false;
this.actionLocked = false;
this.input.enabled = true;
this.time.timeScale = 1;
this.playerBobTween = null;
this.playerGroundY = 0;

    const dataStore = this.registry.get("dataStore");
    this.runState = this.registry.get("runState");
const levelNumber = (this.runState?.levelIndex || 0) + 1;
playMusic(this, `audio_level_${levelNumber}`, { volume: 0.45 });
    const player = this.runState?.player;
    const selectedClassId = player?.classId || "rogue";

    let wave;

if (this.runState.finalBossPhase2Started && !this.runState.finalBossPhase2Cleared) {
  wave = {
    type: "battle",
    enemies: ["level5_boss_phase2"]
  };
} else {
  wave = this.runState.forceBoss
    ? getBossBattleWave(this.runState, dataStore)
    : getWaveAtCurrentIndex(this.runState, dataStore);
}

this.enemies = buildEnemiesForWave(wave, dataStore);

    if (!this.enemies.length) {
      this.scene.start("HallwayScene");
      return;
    }

    this.add.image(width / 2, height / 2, "bg_depth_1").setDisplaySize(width, height);

this.add.rectangle(width / 2, height * 0.885, 560, 130, 0x050508, 0.62)
  .setStrokeStyle(2, 0xc9b56d, 0.45)
  .setDepth(20);

    const playerBase = getPlayerSpriteBase(selectedClassId);

    this.playerSprite = this.add.image(width * 0.75, height * 0.9, `${playerBase}_idle`);
this.playerSprite.setOrigin(0.5, 1);
this.playerSprite.setScale(1);

// store base ground position
this.playerGroundY = this.playerSprite.y;

// store tween reference so we can stop it later
this.playerBobTween = this.tweens.add({
  targets: this.playerSprite,
  y: this.playerGroundY - 8,
  duration: 900,
  yoyo: true,
  repeat: -1
});

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

    const attackButton = this.add.text(width / 2 - 95, height * 0.88, "ATTACK", {
  fontFamily: "Georgia",
  fontSize: "22px",
  color: "#ffffff",
  backgroundColor: "#7b1113",
  padding: { x: 30, y: 10 }
}).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(21);

attackButton.on("pointerdown", () => this.handlePlayerAttack());

this.specialButton = this.add.text(width / 2 + 95, height * 0.88, "SPECIAL", {
  fontFamily: "Georgia",
  fontSize: "22px",
  color: "#ffffff",
  backgroundColor: "#1b3a5a",
  padding: { x: 30, y: 10 }
}).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(21);

this.specialButton.on("pointerdown", () => this.handleSpecialAttack());

this.targetText = this.add.text(width / 2, height * 0.96, "TARGET: AUTO", {
  fontFamily: "Georgia",
  fontSize: "15px",
  color: "#c9b56d",
  stroke: "#000000",
  strokeThickness: 3
}).setOrigin(0.5).setDepth(21);

    this.logText = this.add.text(width / 2, height * 0.80, "Battle started.", {
  fontFamily: "Georgia",
  fontSize: "17px",
  color: "#ffffff",
  stroke: "#000000",
  strokeThickness: 3,
  wordWrap: { width: 760 },
  align: "center"
}).setOrigin(0.5).setDepth(21);

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

this.tweens.add({
  targets: sprite,
  y: sprite.y - 6,
  duration: 850 + index * 120,
  yoyo: true,
  repeat: -1
});

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

if (unit.type === "enemy" && (!unit.enemy || unit.enemy.currentHp <= 0)) {
  this.nextTurn();
  return;
}

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
  if (this.playerBobTween) {
  this.playerBobTween.stop();
}

this.playerSprite.setTexture(`player_${classId}_down`);
this.playerSprite.y = this.playerGroundY + 90;
  // slow motion effect
  this.time.timeScale = 0.35;

  // screen shake
  this.cameras.main.shake(600, 0.01);

  // slight delay then go to game over
  this.time.delayedCall(1200, () => {
  this.time.timeScale = 1;
  this.input.enabled = true;
  this.scene.start("DialogueScene", {

  dialogueIds: ["death_generic", "death_hero_response"],

  returnScene: "GameOverScene"

});
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
  

  handlePlayerAttack() {
  if (this.actionLocked) return;
this.actionLocked = true;

const unit = this.turnQueue[this.turnIndex];
  if (!unit || unit.type !== "player") {
  this.actionLocked = false;
  return;
}
  const target = this.getSelectedTarget();
  if (!target) {
  this.actionLocked = false;
  return;
}

  const player = this.runState.player;
  const base = getPlayerSpriteBase(player.classId);

  const originalX = this.playerSprite.x;
  const targetGroup = this.enemySprites.find(g => g.enemy === target);

  // DASH IN
  this.playerSprite.setTexture(`${base}_dash`);

  this.tweens.add({
    targets: this.playerSprite,
    x: targetGroup ? targetGroup.sprite.x + 115 : originalX - 180,
duration: 260,

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
        this.time.delayedCall(140, () => {
if (targetGroup && target.currentHp > 0) {
  targetGroup.sprite.setTexture(this.getEnemyFrameKey(target, "idle"));
}
          this.playerSprite.setTexture(`${base}_idle`);
          this.playerSprite.x = originalX;
        });

        // NEXT TURN
        this.time.delayedCall(700, () => {
  this.actionLocked = false;
  this.nextTurn();
});
      });
    }
  });
}

handleSpecialAttack() {
  if (this.actionLocked) return;
  this.actionLocked = true;

  const unit = this.turnQueue[this.turnIndex];

  if (!unit || unit.type !== "player") {
    this.actionLocked = false;
    return;
  }

  const player = this.runState.player;

  if (!player.specialUsesRemaining || player.specialUsesRemaining <= 0) {
    this.actionLocked = false;
    this.logText.setText("No special uses remaining.");
    return;
  }

  const target = this.getSelectedTarget();

  if (!target) {
    this.actionLocked = false;
    return;
  }

  player.specialUsesRemaining -= 1;

  const originalX = this.playerSprite.x;
  const originalY = this.playerSprite.y;
  const targetGroup = this.enemySprites.find(group => group.enemy === target);

  this.playerSprite.setTexture(`player_${player.classId}_dash`);

  this.tweens.add({
    targets: this.playerSprite,
    x: targetGroup ? targetGroup.sprite.x + 130 : originalX - 220,
duration: 360,
    onComplete: () => {
      this.playerSprite.setTexture(`player_${player.classId}_special`);

      this.cameras.main.shake(350, 0.016);
      this.cameras.main.flash(220, 255, 255, 255);

      if (targetGroup) {
        targetGroup.sprite.setTexture(this.getEnemyFrameKey(target, "hit"));

        const fx = this.add.image(
          targetGroup.sprite.x,
          targetGroup.sprite.y - 80,
          "fx_burst_purple"
        );

        fx.setScale(1.2);
        fx.setDepth(50);

        this.tweens.add({
          targets: fx,
          alpha: 0,
          scale: 1.9,
          duration: 520,
          onComplete: () => fx.destroy()
        });
      }

      const result = playerAttack(this.runState, target, { isSpecial: true });

      this.logText.setText(`SPECIAL hit ${target.name} for ${result.damage}.`);

      if (result.enemyDefeated && targetGroup) {
        targetGroup.sprite.setTexture(this.getEnemyFrameKey(target, "down"));
        targetGroup.sprite.clearTint();

        this.tweens.add({
          targets: targetGroup.sprite,
          alpha: 0,
          duration: 700,
          delay: 500
        });

        this.selectedEnemyIndex = this.enemies.findIndex(enemy => enemy.currentHp > 0);
      }

      this.refreshHud();

      this.time.delayedCall(620, () => {
        this.playerSprite.setTexture(`${getPlayerSpriteBase(player.classId)}_idle`);
        this.playerSprite.setPosition(originalX, originalY);
      });

      this.time.delayedCall(1250, () => {
        this.actionLocked = false;
        this.nextTurn();
      });
    }
  });
}

animateEnemyAttack(enemy) {
  const player = this.runState.player;
  const playerBase = getPlayerSpriteBase(player.classId);

  const enemyGroup = this.enemySprites.find(g => g.enemy === enemy);

if (!enemyGroup || enemy.currentHp <= 0) {
  this.nextTurn();
  return;
}

  const originalX = enemyGroup.sprite.x;

  // DASH
  enemyGroup.sprite.setTexture(this.getEnemyFrameKey(enemy, "dash"));

  const originalY = enemyGroup.sprite.y;

const attackY =
  enemy.id === "level3_miniboss"
    ? this.playerSprite.y - 120
    : originalY;

this.tweens.add({
  targets: enemyGroup.sprite,
  x: this.playerSprite.x - 130,
  y: attackY,
  duration: enemy.role === "miniboss" ? 360 : 260,

    onComplete: () => {

      // WINDUP if exists
      const windupKey = this.getEnemyFrameKey(enemy, "windup");
      if (this.textures.exists(windupKey)) {
        enemyGroup.sprite.setTexture(windupKey);
      }

      this.time.delayedCall(enemy.role === "miniboss" ? 320 : 120, () => {

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

if (result.playerDefeated) {
  this.time.delayedCall(250, () => {
    enemyGroup.sprite.setTexture(this.getEnemyFrameKey(enemy, "idle"));
    enemyGroup.sprite.x = originalX;
    this.handlePlayerDeath();
  });
  return;
}

// RETURN
this.time.delayedCall(enemy.role === "miniboss" ? 420 : 180, () => {
  enemyGroup.sprite.setTexture(this.getEnemyFrameKey(enemy, "idle"));
enemyGroup.sprite.x = originalX;
enemyGroup.sprite.y = originalY;

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
  const levelNumber = (this.runState.levelIndex || 0) + 1;

  this.runState.forceBoss = false;
  this.runState.bossCleared = true;

  this.registry.set("runState", this.runState);

  this.logText.setText("Boss cleared.");

  const defeatChains = {
    1: ["level1_miniboss_defeat", "level1_post_boss_reflection"],
    2: ["level2_miniboss_defeat", "level2_post_boss_reflection"],
    3: ["level3_miniboss_defeat", "level3_post_boss_reflection"],
    4: ["level4_miniboss_defeat", "level4_post_boss_reflection"],
    5: ["victory_final", "victory_hero_final"]
  };

  this.time.delayedCall(800, () => {
  if (levelNumber >= 5 && !this.runState.finalBossPhase2Started) {
    this.runState.bossTransitionActive = true;
    this.runState.finalBossPhase2Started = true;
    this.runState.forceBoss = false;
    this.runState.bossCleared = false;

    this.registry.set("runState", this.runState);

    this.scene.start("FinalBossEvolutionScene");

    return;
  }

  if (levelNumber >= 5 && this.runState.finalBossPhase2Started) {
    this.runState.finalBossPhase2Cleared = true;
    this.runState.bossTransitionActive = false;
    this.registry.set("runState", this.runState);
  }

  this.scene.start("DialogueScene", {
    dialogueIds: defeatChains[levelNumber] || ["victory_final", "victory_hero_final"],
    returnScene: levelNumber >= 5 ? "ExtractScene" : "LevelCompleteScene"
  });
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
