import Phaser from "phaser";

export class DialogueScene extends Phaser.Scene {
  constructor() {
    super("DialogueScene");

    this.dialogueId = null;
    this.returnScene = null;
    this.returnData = {};
    this.dialogue = null;
    this.lineIndex = 0;
    this.lineText = null;
    this.speakerText = null;
    this.hasAdvanced = false;
  }

  init(data) {
    this.dialogueId = data?.dialogueId || "run_start";
    this.returnScene = data?.returnScene || "HallwayScene";
    this.returnData = data?.returnData || {};
    this.lineIndex = 0;
    this.hasAdvanced = false;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    const dataStore = this.registry.get("dataStore") || window.ELF_DATASTORE;
    const dialogueList = dataStore?.data?.dialogue || [];

    this.dialogue =
      dialogueList.find(item => item.id === this.dialogueId) ||
      dialogueList.find(item => item.id === "run_start");

    if (!this.dialogue) {
      this.scene.start(this.returnScene, this.returnData);
      return;
    }

    this.add.image(w / 2, h / 2, "bg_cutscene_default").setDisplaySize(w, h);

    this.add.rectangle(w / 2, h * 0.72, w * 0.84, h * 0.28, 0x050508, 0.78)
      .setStrokeStyle(2, 0xc9b56d, 0.65);

    this.speakerText = this.add.text(w * 0.12, h * 0.61, this.dialogue.speaker || "Narration", {
      fontFamily: "Georgia",
      fontSize: "26px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 5
    });

    this.lineText = this.add.text(w * 0.12, h * 0.69, "", {
      fontFamily: "Georgia",
      fontSize: "24px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
      wordWrap: { width: w * 0.76 },
      lineSpacing: 8
    });

    this.add.text(w / 2, h * 0.88, "Tap to continue", {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: "#c9b56d",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5);

    this.showLine();

    this.input.once("pointerdown", () => this.advance());
    this.input.keyboard?.once("keydown", () => this.advance());
  }

  showLine() {
    const lines = this.dialogue?.lines || [];
    this.lineText.setText(lines[this.lineIndex] || "");
  }

  advance() {
    if (this.hasAdvanced) return;

    const lines = this.dialogue?.lines || [];

    if (this.lineIndex < lines.length - 1) {
      this.lineIndex += 1;
      this.showLine();

      this.time.delayedCall(120, () => {
        this.input.once("pointerdown", () => this.advance());
        this.input.keyboard?.once("keydown", () => this.advance());
      });

      return;
    }

    this.hasAdvanced = true;
    this.scene.start(this.returnScene, this.returnData);
  }
}
