import Phaser from "phaser";

function getPortraitKey(scene, dialogue, runState) {
  if (!dialogue) return null;

  let portraitId = dialogue.portrait || null;
  const mood = dialogue.portraitMood || "neutral";

  if (dialogue.speaker === "Hero" && runState?.player?.classId) {
    portraitId = runState.player.classId;
  }

  if (!portraitId) {
    const speaker = String(dialogue.speaker || "").toLowerCase();

    if (speaker.includes("doge")) portraitId = "doge";
    else if (speaker.includes("pepe")) portraitId = "pepe";
    else if (speaker.includes("twin")) portraitId = "purple";
    else if (speaker.includes("purple")) portraitId = "purple";
    else if (speaker.includes("extraction")) portraitId = "boss";
    else if (speaker.includes("protocol")) portraitId = "doge";
    else if (speaker.includes("narration")) portraitId = "narrator";
  }

  if (!portraitId) return null;

  const preferredKey = `portrait_${portraitId}_${mood}`;
  const fallbackKey = `portrait_${portraitId}_neutral`;

  if (scene.textures.exists(preferredKey)) return preferredKey;
  if (scene.textures.exists(fallbackKey)) return fallbackKey;

  console.warn("Missing portrait:", preferredKey, fallbackKey);
  return null;
}

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
const runState = this.registry.get("runState");
    const dialogueList = dataStore?.data?.dialogue || [];

    this.dialogue =
      dialogueList.find(item => item.id === this.dialogueId) ||
      dialogueList.find(item => item.id === "run_start");

    if (!this.dialogue) {
      this.scene.start(this.returnScene, this.returnData);
      return;
    }

    this.add.image(w / 2, h / 2, "bg_cutscene_default").setDisplaySize(w, h);

const portraitKey = getPortraitKey(this, this.dialogue, runState);

if (portraitKey && this.textures.exists(portraitKey)) {
  const portrait = this.add.image(w / 2, h * 0.48, portraitKey);
  portrait.setOrigin(0.5, 1);
  portrait.setDepth(5);

  const frame = this.textures.getFrame(portraitKey);
  const frameW = frame?.width || 1;
  const frameH = frame?.height || 1;

  portrait.setScale(Math.min(320 / frameW, 320 / frameH));
}

    const panel = this.add.image(w / 2, h * 0.72, "ui_dialogue_panel");
panel.setDisplaySize(w * 0.84, h * 0.28);
panel.setAlpha(0.95);
panel.setDepth(10);

this.speakerText = this.add.text(w * 0.12, h * 0.61, this.dialogue.speaker || "Narration", {
      fontFamily: "Georgia",
      fontSize: "26px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 5
    }).setDepth(11);

    this.lineText = this.add.text(w * 0.12, h * 0.69, "", {
      fontFamily: "Georgia",
      fontSize: "24px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
      wordWrap: { width: w * 0.76 },
      lineSpacing: 8
    }).setDepth(11);

    this.add.text(w / 2, h * 0.88, "Tap to continue", {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: "#c9b56d",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(11);

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
