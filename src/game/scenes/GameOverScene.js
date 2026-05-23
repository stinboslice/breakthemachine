import Phaser from "phaser";
import { exportRunLogCsv } from "../systems/EventLogger.js";
import { submitRunResult } from "../systems/WalletManager.js";
import { playMusic } from "../systems/AudioManager.js";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    playMusic(this, "audio_game_over", { volume: 0.5 });

    const runState = this.registry.get("runState");
    this.submitFailedRun(runState);

    this.add.image(w / 2, h / 2, "bg_game_over")
      .setDisplaySize(w, h);

    this.add.text(w / 2, h * 0.25, "SYSTEM FAILURE", {
      fontFamily: "Georgia",
      fontSize: "48px",
      color: "#f4e7c1",
      stroke: "#000",
      strokeThickness: 6
    }).setOrigin(0.5);

    const exportButton = this.add.text(w / 2, h * 0.63, "EXPORT BATTLE REPORT", {
      fontFamily: "Georgia",
      fontSize: "22px",
      color: "#f4e7c1",
      backgroundColor: "#111111",
      padding: { x: 24, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    exportButton.on("pointerdown", () => {
      const runState = this.registry.get("runState");
      exportRunLogCsv(runState);
    });

    const button = this.add.image(w / 2, h * 0.75, "button_continue")
      .setInteractive({ useHandCursor: true });

    button.setScale(0.45);

    button.on("pointerdown", () => {
      this.scene.start("SetupScene");
    });
  }

  async submitFailedRun(runState) {
    if (!runState || runState.rewardSubmitted) return;

    try {
      const result = await submitRunResult({
        runId: runState.runId,
        classId: runState.player?.classId,
        buffs: runState.player?.buffs || [],
        weaponTier: runState.player?.weaponTier || "base",
        eventLogJson: runState.eventLog || [],
        result: "failed",
        extractionLevel: Number(runState.levelIndex || 0) + 1,
        bossKills: runState.bossKills || 0,
        runtimeSeconds: runState.runtimeSeconds || 0,
        clientReportVersion: "v1"
      });

      runState.rewardSubmitted = true;
      runState.rewardResult = result;
      this.registry.set("runState", runState);
    } catch (err) {
      console.warn("Failed run submission failed:", err?.message || err);
    }
  }
}
