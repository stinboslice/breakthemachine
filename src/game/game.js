import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene.js";
import { SetupScene } from "./scenes/SetupScene.js";
import { BattleScene } from "./scenes/BattleScene.js";
import { RunIntroScene } from "./scenes/RunIntroScene.js";
import { HallwayScene } from "./scenes/HallwayScene.js";


export function createGame() {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game-root",
    width: 1280,
    height: 720,
    backgroundColor: "#08080c",
    pixelArt: true,
    roundPixels: true,
    scene: [BootScene, SetupScene, RunIntroScene, HallwayScene, BattleScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  });
}
