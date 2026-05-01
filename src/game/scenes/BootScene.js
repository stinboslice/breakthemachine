import Phaser from "phaser";
import { loadAllAssets } from "../systems/AssetManifest.js";
import { DataStore } from "../systems/DataStore.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
    this.hasStarted = false;
  }

  preload() {
  const w = this.scale.width;
  const h = this.scale.height;

  this.add.rectangle(w / 2, h / 2, w, h, 0x08080c, 1);

  const title = this.add.text(w / 2, h * 0.42, "LOADING ELF", {
    fontFamily: "Georgia",
    fontSize: "34px",
    color: "#f4e7c1",
    stroke: "#000000",
    strokeThickness: 5
  }).setOrigin(0.5);

  const progressText = this.add.text(w / 2, h * 0.52, "0%", {
    fontFamily: "Georgia",
    fontSize: "22px",
    color: "#c9b56d",
    stroke: "#000000",
    strokeThickness: 4
  }).setOrigin(0.5);

  this.load.on("progress", value => {
    progressText.setText(`${Math.floor(value * 100)}%`);
  });

  this.load.on("complete", () => {
    title.setText("READY");
    progressText.setText("Tap to begin");
  });

  loadAllAssets(this);
}

  create() {
    
    const dataStore = new DataStore(this);
    dataStore.loadAll();

    this.registry.set("dataStore", dataStore);
    window.ELF_DATASTORE = dataStore;

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

    this.add.text(width / 2, height / 2 + 42, "Tap to begin", {
      fontFamily: "Georgia",
      fontSize: "22px",
      color: "#b9a66a",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    const startZone = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    const startGame = () => {
      if (this.hasStarted) return;
      this.hasStarted = true;

      this.scene.start("SetupScene");
    };

    startZone.on("pointerdown", startGame);
    startZone.on("pointerup", startGame);

    this.input.on("pointerdown", startGame);
    this.input.on("pointerup", startGame);

    this.input.keyboard?.on("keydown", startGame);

    this.game.canvas.addEventListener("click", startGame, { once: true });
    this.game.canvas.addEventListener("touchend", startGame, { once: true });

    window.addEventListener("click", startGame, { once: true });
    window.addEventListener("touchend", startGame, { once: true });
  }
}
