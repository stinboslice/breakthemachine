import Phaser from "phaser";
import { resolveRoom } from "../systems/RoomResolver.js";
import {
  advanceHallwaySet,
  startBattleBlockForCurrentSet,
  shouldShowBossDoor
} from "../systems/RouteSystem.js";

import { logEvent } from "../systems/EventLogger.js";

const ROOM_TITLES = {
  safe: "SAFE PASSAGE",
  treasure: "TREASURE FOUND",
  corrupt: "CORRUPT CHAMBER",
  trap: "TRAP TRIGGERED",
  enemy: "HOSTILE CONTACT"
};

const ROOM_ICONS = {
  safe: "icon_room_safe",
  treasure: "icon_room_treasure",
  corrupt: "icon_room_corrupt",
  trap: "icon_room_trap",
  enemy: "icon_room_enemy"
};

function fitImage(scene, image, maxWidth, maxHeight) {
  const frame = scene.textures.getFrame(image.texture.key);
  const w = frame?.width || 1;
  const h = frame?.height || 1;
  image.setScale(Math.min(maxWidth / w, maxHeight / h));
}

export class RoomResultScene extends Phaser.Scene {
  constructor() {
    super("RoomResultScene");
  }

  create(data) {
    const w = this.scale.width;
    const h = this.scale.height;

    const roomType = data?.roomType || "enemy";

    this.add.image(w / 2, h / 2, "bg_cutscene_default")
      .setDisplaySize(w, h);

    const panel = this.add.image(w / 2, h / 2, "ui_room_result_panel");
    fitImage(this, panel, 620, 620);

    this.add.text(w / 2, h * 0.24, ROOM_TITLES[roomType], {
      fontFamily: "Georgia",
      fontSize: "30px",
      color: "#f4e7c1",
      stroke: "#000",
      strokeThickness: 5
    }).setOrigin(0.5);

    const icon = this.add.image(w / 2, h * 0.40, ROOM_ICONS[roomType]);
    fitImage(this, icon, 120, 120);

    this.add.text(w / 2, h * 0.56, this.getRoomBody(roomType), {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: 420 },
      stroke: "#000",
      strokeThickness: 3
    }).setOrigin(0.5);

    const button = this.add.image(w / 2, h * 0.76, "button_continue")
      .setInteractive({ useHandCursor: true });

    fitImage(this, button, 250, 68);

    button.on("pointerdown", () => {
  let runState = this.registry.get("runState");
  const dataStore = this.registry.get("dataStore") || window.ELF_DATASTORE;

  runState = resolveRoom(runState, roomType);

logEvent(runState, "room_resolved", {
  roomType,
  routeSetIndex: runState.route?.setIndex,
  currentRoomType: runState.route?.currentRoomType,
  playerHp: runState.player?.hp,
  rewards: {
    rewardDamageMult: runState.route?.rewardDamageMult,
    rewardCritFlat: runState.route?.rewardCritFlat,
    rewardFirstHitBlock: runState.route?.rewardFirstHitBlock,
    trapStacks: runState.route?.trapStacks,
    trapDamageMult: runState.route?.trapDamageMult
  }
});
      
  if (roomType === "safe") {
    runState = advanceHallwaySet(runState);
    logEvent(runState, "hallway_set_advanced", {
  newSetIndex: runState.route?.setIndex,
  bossDoorReady: runState.route?.bossDoorReady || false
});
    this.registry.set("runState", runState);

    if (shouldShowBossDoor(runState, dataStore)) {

      logEvent(runState, "boss_door_ready", {
  level: (runState.levelIndex || 0) + 1
});
this.registry.set("runState", runState);
      this.scene.start("BossDoorScene");
      return;
    }

    this.scene.start("HallwayScene");
    return;
  }

  runState = startBattleBlockForCurrentSet(runState);
      logEvent(runState, "battle_started", {
  roomType,
  level: (runState.levelIndex || 0) + 1,
  waveIndex: runState.waveIndex || 0,
  forceBoss: !!runState.forceBoss
});
  this.registry.set("runState", runState);
  this.scene.start("BattleScene");
});
  }

  getRoomBody(roomType) {
    if (roomType === "safe") return "You found a stable corridor. No ambush. No corruption.";
    if (roomType === "treasure") return "A reward has been found. A fight begins after you claim it.";
    if (roomType === "corrupt") return "Power answers, but it leaves a mark. A fight begins.";
    if (roomType === "trap") return "A hostile corridor triggers a penalty. A fight begins.";
    return "The corridor opens into an active combat zone.";
  }
}
