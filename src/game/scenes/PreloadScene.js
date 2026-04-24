import { IMAGE_ASSETS, JSON_ASSETS } from "../systems/AssetManifest.js";

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    console.log("Loading assets...");

    // Load images
    IMAGE_ASSETS.forEach(([key, path]) => {
      this.load.image(key, path);
    });

    // Load JSON
    JSON_ASSETS.forEach(([key, path]) => {
      this.load.json(key, path);
    });
  }

  create() {
    console.log("Assets loaded");
    this.scene.start("TestScene");
  }
}
