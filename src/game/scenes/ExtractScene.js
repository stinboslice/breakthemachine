import Phaser from "phaser";

export class ExtractScene extends Phaser.Scene {
  constructor() {
    super("ExtractScene");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    const runState = this.registry.get("runState");

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

    const button = this.add.image(w / 2, h * 0.72, "button_continue")
      .setInteractive({ useHandCursor: true });

    button.setScale(0.45);

    button.on("pointerdown", () => {
      this.scene.start("SetupScene");
    });
  }
}
