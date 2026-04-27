import Phaser from "phaser";
import { loadAllAssets } from "../systems/AssetManifest.js";
import { DataStore } from "../systems/DataStore.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    loadAllAssets(this);
  }

  create() {
  const dataStore = new DataStore(this);
  dataStore.loadAll();
  this.registry.set("dataStore", dataStore);

  const width = this.scale.width;
  const height = this.scale.height;

  this.add.image(width / 2, height / 2, "bg_cutscene_default")
    .setDisplaySize(width, height);

  this.add.text(width / 2, height / 2 - 20, "ELF: BREAK THE MACHINE", {
    fontFamily: "Georgia",
    fontSize: "42px",
    color: "#f4e7c1",
    stroke: "#000000",
    strokeThickness: 6
  }).setOrigin(0.5);

  const startText = this.add.text(width / 2, height / 2 + 40, "Tap to begin", {
    fontFamily: "Georgia",
    fontSize: "20px",
    color: "#b9a66a"
  }).setOrigin(0.5);

  // 👇 THIS is what actually fixes your issue
  this.input.once("pointerdown", () => {
    this.scene.start("SetupScene");
  });

  // backup for desktop
  this.input.keyboard.once("keydown-SPACE", () => {
    this.scene.start("SetupScene");
  });
}
}
