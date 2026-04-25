import Phaser from "phaser";

function getPlayerSpriteBase(classId) {
  if (classId === "rogue") return "player_rogue";
  if (classId === "vanguard") return "player_vanguard";
  if (classId === "berserker") return "player_berserker";
  return "player_rogue";
}

function makeSpriteKey(base, frame) {
  return `${base}_${frame}`;
}

export class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");

    this.bg = null;
    this.player = null;
    this.enemySprites = {};
    this.enemyText = {};
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.bg = this.add.image(width / 2, height / 2, "bg_depth_1");
    this.bg.setDisplaySize(width, height);

    this.player = this.add.image(width * 0.78, height * 0.84, "player_rogue_idle");
    this.player.setOrigin(0.5, 1);
    this.player.setScale(2);

    this.add.text(width / 2, 48, "Battle Scene Loaded", {
      fontFamily: "Georgia",
      fontSize: "28px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5);

    this.scale.on("resize", this.handleResize, this);
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    if (this.bg) {
      this.bg.setPosition(width / 2, height / 2);
      this.bg.setDisplaySize(width, height);
    }

    if (this.player) {
      this.player.setPosition(width * 0.78, height * 0.84);
    }
  }

  setPlayerFrame(classId, frame) {
    const base = getPlayerSpriteBase(classId);
    const key = makeSpriteKey(base, frame);

    if (this.player && this.textures.exists(key)) {
      this.player.setTexture(key);
    }
  }
}
