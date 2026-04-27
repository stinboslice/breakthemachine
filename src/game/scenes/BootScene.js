import Phaser from "phaser";
import { loadAllAssets } from "../systems/AssetManifest.js";
import { DataStore } from "../systems/DataStore.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
    this.hasStarted = false;
  }

  preload() {
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

    this.time.delayedCall(2500, startGame);
  }
}
