import Phaser from "phaser";
import { exportRunLogCsv } from "../systems/EventLogger.js";

function getLevelReached(runState) {
  return Number(runState?.levelIndex || 0) + 1;
}

function getPendingCredits(runState) {
  return Number(runState?.pendingRewardCredits || runState?.rewardResult?.result?.rewardCredits || 0);
}

function getSpentCredits(runState) {
  return Number(runState?.totalBurn || 0);
}

function getOutcome(runState) {
  if (runState?.extracted) return "RUN EXTRACTED";
  if (runState?.completed) return "MACHINE BROKEN";
  return "SYSTEM FAILURE";
}

export class RunSummaryScene extends Phaser.Scene {
  constructor() {
    super("RunSummaryScene");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const runState = this.registry.get("runState");

    const spent = getSpentCredits(runState);
    const earned = getPendingCredits(runState);
    const net = earned - spent;
    const levelReached = getLevelReached(runState);

    this.add.image(w / 2, h / 2, "bg_cutscene_default")
      .setDisplaySize(w, h);

    this.add.rectangle(w / 2, h / 2, w * 0.72, h * 0.72, 0x050508, 0.72)
      .setStrokeStyle(2, 0xc9b56d, 0.55);

    this.add.text(w / 2, h * 0.18, "RUN SUMMARY", {
      fontFamily: "Georgia",
      fontSize: "44px",
      color: "#f4e7c1",
      stroke: "#000",
      strokeThickness: 7
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.28, getOutcome(runState), {
      fontFamily: "Georgia",
      fontSize: "26px",
      color: "#c9b56d",
      stroke: "#000",
      strokeThickness: 4
    }).setOrigin(0.5);

    const lines = [
      `Level reached: ${levelReached}`,
      `Credits spent: ${spent}`,
      `Credits earned: ${earned}`,
      `Net result: ${net >= 0 ? "+" : ""}${net}`
    ];

    this.add.text(w / 2, h * 0.43, lines.join("\n"), {
      fontFamily: "Georgia",
      fontSize: "24px",
      color: "#ffffff",
      stroke: "#000",
      strokeThickness: 4,
      align: "center",
      lineSpacing: 14
    }).setOrigin(0.5);

    const exportButton = this.add.text(w / 2, h * 0.65, "EXPORT RUN LOG", {
      fontFamily: "Georgia",
      fontSize: "22px",
      color: "#f4e7c1",
      backgroundColor: "#111111",
      padding: { x: 24, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    exportButton.on("pointerdown", () => {
      exportRunLogCsv(this.registry.get("runState"));
    });

    const continueButton = this.add.image(w / 2, h * 0.80, "button_continue")
      .setInteractive({ useHandCursor: true });

    continueButton.setScale(0.45);

    continueButton.on("pointerdown", () => {
      this.scene.start("SetupScene");
    });
  }
}
