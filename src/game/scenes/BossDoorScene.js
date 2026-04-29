import Phaser from "phaser";

function fitImage(scene, image, maxWidth, maxHeight) {
  const frame = scene.textures.getFrame(image.texture.key);
  const w = frame?.width || 1;
  const h = frame?.height || 1;
  image.setScale(Math.min(maxWidth / w, maxHeight / h));
}

export class BossDoorScene extends Phaser.Scene {
  constructor() {
    super("BossDoorScene");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    const runState = this.registry.get("runState");
    const levelNumber = (runState?.levelIndex || 0) + 1;

    this.add.image(w / 2, h / 2, `bg_boss_door_level${levelNumber}`)
      .setDisplaySize(w, h);

    this.add.text(w / 2, h * 0.22, "CORE CHAMBER", {
      fontFamily: "Georgia",
      fontSize: "42px",
      color: "#f4e7c1",
      stroke: "#000",
      strokeThickness: 7
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.32, "The final gate of this level is open.", {
      fontFamily: "Georgia",
      fontSize: "22px",
      color: "#c9b56d",
      stroke: "#000",
      strokeThickness: 4
    }).setOrigin(0.5);

    const button = this.add.image(w / 2, h * 0.76, "button_continue")
      .setInteractive({ useHandCursor: true });

    fitImage(this, button, 260, 70);

    button.on("pointerdown", () => {
      const state = this.registry.get("runState");
      state.forceBoss = true;
      this.registry.set("runState", state);
      this.scene.start("BattleScene");
    });
  }
}
