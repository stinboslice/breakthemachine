import Phaser from "phaser";
import { logEvent, exportRunLogCsv } from "../systems/EventLogger.js";
import { playMusic } from "../systems/AudioManager.js";

function getLevelRewardCredits(levelNumber) {
  if (levelNumber === 1) return 1;
  if (levelNumber === 2) return 2;
  if (levelNumber === 3) return 4;
  if (levelNumber === 4) return 7;
  return 12;
}

function bankPendingLevelReward(runState, levelNumber) {
  if (!runState) return;

  const levelReward = getLevelRewardCredits(levelNumber);

  if (!runState.levelRewardsBanked) {
    runState.levelRewardsBanked = {};
  }

  if (!runState.levelRewardsBanked[levelNumber]) {
    runState.pendingRewardCredits =
      (runState.pendingRewardCredits || 0) + levelReward;

    runState.levelRewardsBanked[levelNumber] = true;

    logEvent(runState, "pending_reward_added", {
      level: levelNumber,
      rewardCredits: levelReward,
      pendingRewardCredits: runState.pendingRewardCredits
    });
  }
}

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super("LevelCompleteScene");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    playMusic(this, "audio_level_complete", { volume: 0.48 });

    const runState = this.registry.get("runState");
    const levelNumber = (runState?.levelIndex || 0) + 1;

    this.add.image(w / 2, h / 2, "bg_cutscene_default")
      .setDisplaySize(w, h);

    this.add.text(w / 2, h * 0.28, `LEVEL ${levelNumber} CLEARED`, {
      fontFamily: "Georgia",
      fontSize: "42px",
      color: "#f4e7c1",
      stroke: "#000",
      strokeThickness: 7
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.42, "Extract now to secure pending credits, or continue deeper and risk losing them.", {
      fontFamily: "Georgia",
      fontSize: "22px",
      color: "#c9b56d",
      stroke: "#000",
      strokeThickness: 4,
      align: "center",
      wordWrap: { width: Math.min(760, w * 0.86) }
    }).setOrigin(0.5);

    const pendingPreview =
      (runState?.pendingRewardCredits || 0) + getLevelRewardCredits(levelNumber);

    this.add.text(w / 2, h * 0.50, `Pending if secured now: ${pendingPreview} credits`, {
      fontFamily: "Georgia",
      fontSize: "20px",
      color: "#f4e7c1",
      stroke: "#000",
      strokeThickness: 4
    }).setOrigin(0.5);

    const continueButton = this.add.text(w / 2, h * 0.61, "CONTINUE TO NEXT LEVEL", {
      fontFamily: "Georgia",
      fontSize: "24px",
      color: "#ffffff",
      backgroundColor: "#7b1113",
      padding: { x: 28, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const extractButton = this.add.text(w / 2, h * 0.73, "EXTRACT AND SECURE", {
      fontFamily: "Georgia",
      fontSize: "24px",
      color: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 28, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const exportButton = this.add.text(w / 2, h * 0.85, "EXPORT RUN LOG", {
      fontFamily: "Georgia",
      fontSize: "20px",
      color: "#f4e7c1",
      backgroundColor: "#111111",
      padding: { x: 24, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    exportButton.on("pointerdown", () => {
      const state = this.registry.get("runState");
      exportRunLogCsv(state);
    });

    continueButton.on("pointerdown", () => {
      if (!runState) return;

      bankPendingLevelReward(runState, levelNumber);

      runState.levelIndex = (runState.levelIndex || 0) + 1;
      runState.waveIndex = 0;
      runState.forceBoss = false;
      runState.bossCleared = false;
      runState.scanUsed = false;

      runState.route = {
        ...runState.route,
        level: runState.levelIndex + 1,
        setIndex: 0,
        activeSetIndex: null,
        currentChoices: [],
        currentRoomType: null,
        scanUsed: false,
        scannedChoiceIndex: null,
        bossDoorReady: false,
        pendingBattleEndWaveIndex: null
      };

      runState.player.hp = runState.player.maxHp;
      runState.player.specialUsesRemaining = runState.player.specialUsesMax;

      logEvent(runState, "continue_to_next_level", {
        nextLevel: (runState.levelIndex || 0) + 1,
        pendingRewardCredits: runState.pendingRewardCredits || 0,
        playerHpResetTo: runState.player?.maxHp,
        specialUsesResetTo: runState.player?.specialUsesMax
      });

      this.registry.set("runState", runState);

      const nextLevelNumber = (runState.levelIndex || 0) + 1;

      const levelIntroChains = {
        1: ["level1_intro", "level1_intro_response"],
        2: ["level2_intro", "level2_intro_response"],
        3: ["level3_intro", "level3_intro_response"],
        4: ["level4_intro", "level4_intro_response"],
        5: ["level5_intro", "level5_intro_response"]
      };

      this.scene.start("DialogueScene", {
        dialogueIds: levelIntroChains[nextLevelNumber] || [`level${nextLevelNumber}_intro`],
        returnScene: "HallwayScene"
      });
    });

    extractButton.on("pointerdown", () => {
      const runState = this.registry.get("runState");
      if (!runState) return;

      bankPendingLevelReward(runState, levelNumber);

      runState.runEnded = true;
      runState.extracted = true;
      runState.completed = false;

      logEvent(runState, "run_extracted", {
        level: levelNumber,
        playerHp: runState.player?.hp,
        pendingRewardCredits: runState.pendingRewardCredits || 0,
        completed: false
      });

      this.registry.set("runState", runState);

      const extractChains = {
        1: ["extract_level_1", "extract_level_1_response"],
        2: ["extract_level_2", "extract_level_2_response"],
        3: ["extract_level_3", "extract_level_3_response"],
        4: ["extract_level_4", "extract_level_4_response"]
      };

      this.scene.start("DialogueScene", {
        dialogueIds: extractChains[levelNumber] || [`extract_level_${levelNumber}`],
        returnScene: "ExtractScene"
      });
    });
  }
}
