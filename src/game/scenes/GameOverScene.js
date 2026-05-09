import Phaser from "phaser";
import { exportRunLogCsv } from "../systems/EventLogger.js";
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

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
      this.scene.start("SetupScene"); // restart run
    });
  }
}
