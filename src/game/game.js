import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene.js";
import { BattleScene } from "./scenes/BattleScene.js";

export function createGame() {
  const config = {
    type: Phaser.AUTO,
    parent: "game-root",
    width: 1280,
    height: 720,
    backgroundColor: "#08080c",
    pixelArt: true,
    roundPixels: true,
    scene: [BootScene, BattleScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };

  return new Phaser.Game(config);
}
