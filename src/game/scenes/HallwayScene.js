import Phaser from "phaser";

const ROOM_ICONS = {
  trap: "icon_room_trap",
  corrupt: "icon_room_corrupt",
  treasure: "icon_room_treasure",
  safe: "icon_room_safe",
  enemy: "icon_room_enemy"
};

const ROOM_LABELS = {
  trap: "label_trap",
  corrupt: "label_corrupt",
  treasure: "label_treasure",
  safe: "label_safe",
  enemy: "label_enemy"
};

const HALLWAY_BUTTONS = [
  "ui_hallway_button_left",
  "ui_hallway_button_center",
  "ui_hallway_button_right"
];

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function fitImage(scene, image, maxWidth, maxHeight) {
  const frame = scene.textures.getFrame(image.texture.key);
  const w = frame?.width || 1;
  const h = frame?.height || 1;
  image.setScale(Math.min(maxWidth / w, maxHeight / h));
}

export class HallwayScene extends Phaser.Scene {
  constructor() {
    super("HallwayScene");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    const runState = this.registry.get("runState");
    const levelNumber = (runState?.levelIndex || 0) + 1;

    const choices = shuffle(["trap", "corrupt", "treasure", "safe", "enemy"]).slice(0, 3);

    if (runState) {
      runState.route.currentChoices = choices.map((roomType, index) => ({
        id: `${levelNumber}_${Date.now()}_${index}_${roomType}`,
        roomType,
        revealed: false
      }));

      this.registry.set("runState", runState);
    }

    const bgKey = `bg_hallway_${levelNumber}`;

    this.add.image(w / 2, h / 2, bgKey)
      .setDisplaySize(w, h);

    this.add.text(w / 2, 48, `LEVEL ${levelNumber} ROUTE`, {
      fontFamily: "Georgia",
      fontSize: "36px",
      color: "#f4e7c1",
      stroke: "#000",
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(w / 2, 90, "Choose one of three hallways.", {
      fontFamily: "Georgia",
      fontSize: "20px",
      color: "#c9b56d",
      stroke: "#000",
      strokeThickness: 4
    }).setOrigin(0.5);

    const xPositions = [w * 0.24, w * 0.5, w * 0.76];

    choices.forEach((roomType, index) => {
      const x = xPositions[index];
      const y = h * 0.53;

      const button = this.add.image(x, y, HALLWAY_BUTTONS[index])
        .setInteractive({ useHandCursor: true });

      fitImage(this, button, 275, 360);

      const icon = this.add.image(x, y - 5, ROOM_ICONS[roomType]);
      fitImage(this, icon, 92, 92);

      const label = this.add.image(x, y + 118, ROOM_LABELS[roomType]);
      fitImage(this, label, 150, 48);
      label.setVisible(false);

      button.on("pointerdown", () => {
        const updatedState = this.registry.get("runState");
        if (updatedState) {
          updatedState.route.currentRoomType = roomType;
          this.registry.set("runState", updatedState);
        }

        this.scene.start("RoomResultScene", { roomType });
      });
    });

    const scanButton = this.add.image(w / 2, h * 0.89, "button_scan")
      .setInteractive({ useHandCursor: true });

    fitImage(this, scanButton, 230, 62);

    scanButton.on("pointerdown", () => {
      const runState = this.registry.get("runState");
      const isRogue = runState?.player?.classId === "rogue";

      if (!isRogue || runState.route.scanUsed) return;

      runState.route.scanUsed = true;
      this.registry.set("runState", runState);

      this.scene.restart();
    });
  }
}
