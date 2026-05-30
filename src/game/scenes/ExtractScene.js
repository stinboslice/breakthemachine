import Phaser from "phaser";
import { exportRunLogCsv } from "../systems/EventLogger.js";
import { submitRunResult } from "../systems/WalletManager.js";

function getFallbackRewardCredits(levelNumber) {
  if (levelNumber === 1) return 1;
  if (levelNumber === 2) return 2;
  if (levelNumber === 3) return 4;
  if (levelNumber === 4) return 7;
  return 12;
}
export class ExtractScene extends Phaser.Scene {
  constructor() {
    super("ExtractScene");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    const runState = this.registry.get("runState");
    this.submitExtractedRun(runState);

    this.add.image(w / 2, h / 2, "bg_cutscene_default")
      .setDisplaySize(w, h);

    this.add.text(w / 2, h * 0.30, "RUN EXTRACTED", {
      fontFamily: "Georgia",
      fontSize: "44px",
      color: "#f4e7c1",
      stroke: "#000",
      strokeThickness: 7
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.43, "Reward path locked. Run ended.", {
      fontFamily: "Georgia",
      fontSize: "24px",
      color: "#c9b56d",
      stroke: "#000",
      strokeThickness: 4
    }).setOrigin(0.5);

    const exportButton = this.add.text(w / 2, h * 0.60, "EXPORT RUN LOG", {
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

    const button = this.add.image(w / 2, h * 0.72, "button_continue")
      .setInteractive({ useHandCursor: true });

    button.setScale(0.45);

    button.on("pointerdown", () => {
      this.scene.start("RunSummaryScene");
    });
  }

  async submitExtractedRun(runState) {
    if (!runState || runState.rewardSubmitted) return;

    try {
      const levelReached = Number(runState.levelIndex || 0) + 1;

console.log("EXTRACT SUBMIT", {
  runId: runState.runId,
  extractionLevel: levelReached,
  pendingRewardCredits: runState.pendingRewardCredits,
  rewardSubmitted: runState.rewardSubmitted,
  eventLogLength: runState.eventLog?.length || 0
});

      const result = await submitRunResult({
  runId: runState.runId,
  classId: runState.player?.classId,
  buffs: runState.player?.buffs || [],
  weaponTier: runState.player?.weaponTier || "base",
  eventLogJson: runState.eventLog || [],
  result: "extracted",
  extractionLevel: levelReached,
  pendingRewardCredits:
  runState.pendingRewardCredits > 0
    ? runState.pendingRewardCredits
    : getFallbackRewardCredits(levelReached),
  bossKills: runState.bossKills || 0,
  runtimeSeconds: runState.runtimeSeconds || 0,
  clientReportVersion: "v1"
});

      runState.rewardSubmitted = true;
      runState.rewardResult = result;
      this.registry.set("runState", runState);
  
    } catch (err) {
  alert(`Run reward submission failed: ${err?.message || err}`);
  console.error("Run reward submission failed:", err);
}
  }
}
