export class SetupScene extends Phaser.Scene {
  constructor() {
    super("SetupScene");
  }

  create() {
    console.log("SETUP SCENE STARTED");

    const width = this.scale.width;
    const height = this.scale.height;

    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);

    this.add.text(width / 2, height / 2, "SETUP SCENE WORKS", {
      fontSize: "32px",
      color: "#ffffff"
    }).setOrigin(0.5);
  }
}
