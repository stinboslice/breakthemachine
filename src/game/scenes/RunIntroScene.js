import Phaser from "phaser";

export class RunIntroScene extends Phaser.Scene {
  constructor() {
    super("RunIntroScene");
    this.hasStarted = false;
  }

  create() {
  this.hasStarted = false;
  this.input.enabled = true;

  const w = this.scale.width;
  const h = this.scale.height;

    const runState = this.registry.get("runState");
    const player = runState?.player;

    this.add.image(w / 2, h / 2, "bg_cutscene_default")
      .setDisplaySize(w, h);

    this.add.text(w / 2, h * 0.25, "INITIALIZING RUN", {
      fontFamily: "Georgia",
      fontSize: "36px",
      color: "#f4e7c1",
      stroke: "#000",
      strokeThickness: 6
    }).setOrigin(0.5);

    if (player) {
      this.add.text(w / 2, h * 0.40, `${player.characterName}`, {
        fontFamily: "Georgia",
        fontSize: "28px",
        color: "#f4e7c1",
        stroke: "#000",
        strokeThickness: 5
      }).setOrigin(0.5);

      this.add.text(w / 2, h * 0.47, `${player.className}`, {
        fontFamily: "Georgia",
        fontSize: "22px",
        color: "#c9b56d",
        stroke: "#000",
        strokeThickness: 4
      }).setOrigin(0.5);
    }

    this.add.text(w / 2, h * 0.65, "Tap to enter simulation", {
      fontFamily: "Georgia",
      fontSize: "20px",
      color: "#b9a66a",
      stroke: "#000",
      strokeThickness: 3
    }).setOrigin(0.5);

    const start = () => {
      if (this.hasStarted) return;
      this.hasStarted = true;

      this.scene.start("DialogueScene", {
  dialogueId: "run_start",
  returnScene: "DialogueScene",
  returnData: {
    dialogueId: `level${(runState?.levelIndex || 0) + 1}_intro`,
    returnScene: "HallwayScene"
  }
});
    };

    this.input.off("pointerdown");
this.input.once("pointerdown", start);
  }
}
