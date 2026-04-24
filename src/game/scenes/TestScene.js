export default class TestScene extends Phaser.Scene {
  constructor() {
    super("TestScene");
  }

  create() {
    // Background test
    this.add.image(400, 300, "bg_depth_1");

    // Simple debug text
    this.add.text(20, 20, "Game Boot Successful", {
      fontSize: "24px",
      fill: "#ffffff"
    });
  }
}
