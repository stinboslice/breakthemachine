import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene.js";
import { SetupScene } from "./scenes/SetupScene.js";
import { BattleScene } from "./scenes/BattleScene.js";
import { RunIntroScene } from "./scenes/RunIntroScene.js";
import { HallwayScene } from "./scenes/HallwayScene.js";
import { RoomResultScene } from "./scenes/RoomResultScene.js";
import { BossDoorScene } from "./scenes/BossDoorScene.js";
import { LevelCompleteScene } from "./scenes/LevelCompleteScene.js";
import { GameOverScene } from "./scenes/GameOverScene.js";
import { ExtractScene } from "./scenes/ExtractScene.js";
import { DialogueScene } from "./scenes/DialogueScene.js";
import { FinalBossEvolutionScene } from "./scenes/FinalBossEvolutionScene.js";
import { RunSummaryScene } from "./scenes/RunSummaryScene.js";

export function createGame() {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game-root",
    width: 1280,
    height: 720,
    backgroundColor: "#08080c",
    pixelArt: true,
    roundPixels: true,
    scene: [
  BootScene,
  SetupScene,
  DialogueScene,
  RunIntroScene,
  HallwayScene,
  RoomResultScene,
  BossDoorScene,
  BattleScene,
FinalBossEvolutionScene,
LevelCompleteScene,
  GameOverScene,
  ExtractScene,
      RunSummaryScene
      
],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  });
}
