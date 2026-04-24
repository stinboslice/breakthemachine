import Phaser from "phaser";
import { loadAllAssets } from "../systems/AssetManifest.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    loadAllAssets(this);
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.image(width / 2, height / 2, "bg_cutscene_default")
      .setDisplaySize(width, height);

    this.add.text(width / 2, height / 2, "ELF: BREAK THE MACHINE", {
      fontFamily: "Georgia",
      fontSize: "42px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 64, "Boot scene loaded", {
      fontFamily: "Georgia",
      fontSize: "22px",
      color: "#b9a66a",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);
  }
}
