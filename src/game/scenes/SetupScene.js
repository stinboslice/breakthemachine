import Phaser from "phaser";

const BUFF_ICON_KEYS = {
  hp_boost: "icon_buff_hp",
  damage_boost: "icon_buff_damage",
  speed_boost: "icon_buff_speed",
  crit_boost: "icon_buff_crit",
  block: "icon_buff_block",
  double_strike: "icon_buff_double_strike"
};

function safeFit(scene, image, maxWidth, maxHeight) {
  const frame = scene.textures.getFrame(image.texture.key);
  const w = frame?.width || image.width || 1;
  const h = frame?.height || image.height || 1;
  image.setScale(Math.min(maxWidth / w, maxHeight / h));
}

export class SetupScene extends Phaser.Scene {
  constructor() {
    super("SetupScene");
    this.selectedClassId = null;
    this.selectedBuffs = [];
    this.statusText = null;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    const dataStore = this.registry.get("dataStore") || window.ELF_DATASTORE;
    const classes = dataStore?.data?.classes || this.cache.json.get("classes") || [];
    const buffs = dataStore?.data?.buffs || this.cache.json.get("buffs") || [];

    this.add.image(width / 2, height / 2, "bg_cutscene_default")
      .setDisplaySize(width, height);

    this.add.text(width / 2, 48, "CHOOSE YOUR ELF", {
      fontFamily: "Georgia",
      fontSize: "38px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    if (!classes.length) {
      this.add.text(width / 2, height / 2, "NO CLASSES FOUND", {
        fontFamily: "Georgia",
        fontSize: "30px",
        color: "#ff4444"
      }).setOrigin(0.5);
      return;
    }

    this.drawClasses(classes);
    this.drawBuffShelf(buffs);
    this.drawStatus();
  }

  drawClasses(classes) {
    const width = this.scale.width;
    const height = this.scale.height;

    classes.forEach((cls, index) => {
      const x = width * 0.25 + index * width * 0.25;
      const y = height * 0.36;

      if (this.textures.exists("ui_class_panel")) {
        const panel = this.add.image(x, y, "ui_class_panel").setInteractive({ useHandCursor: true });
        safeFit(this, panel, 235, 310);
        panel.on("pointerdown", () => this.selectClass(cls));
      }

      const spriteKey = `player_${cls.id}_idle`;

      if (this.textures.exists(spriteKey)) {
        const sprite = this.add.image(x, y + 36, spriteKey).setInteractive({ useHandCursor: true });
        safeFit(this, sprite, 120, 170);
        sprite.on("pointerdown", () => this.selectClass(cls));
      }

      this.add.text(x, y + 145, cls.name, {
        fontFamily: "Georgia",
        fontSize: "22px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5);

      this.add.text(x, y + 172, `HP ${cls.hp}  ATK ${cls.attackMultiplier}  SPD ${cls.speed}`, {
        fontFamily: "Georgia",
        fontSize: "13px",
        color: "#c9b56d",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(0.5);
    });
  }

  drawBuffShelf(buffs) {
    const width = this.scale.width;
    const height = this.scale.height;

    if (this.textures.exists("ui_buff_shelf")) {
      const shelf = this.add.image(width / 2, height * 0.74, "ui_buff_shelf");
      safeFit(this, shelf, 760, 180);
    }

    this.add.text(width / 2, height * 0.625, "BUFF SHELF", {
      fontFamily: "Georgia",
      fontSize: "24px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5);

    buffs.forEach((buff, index) => {
      const spacing = 116;
      const startX = width / 2 - ((buffs.length - 1) * spacing) / 2;
      const x = startX + index * spacing;
      const y = height * 0.735;
      const key = BUFF_ICON_KEYS[buff.id];

      if (key && this.textures.exists(key)) {
        const icon = this.add.image(x, y - 20, key).setInteractive({ useHandCursor: true });
        safeFit(this, icon, 62, 62);
        icon.on("pointerdown", () => this.toggleBuff(buff));
      }

      this.add.text(x, y + 44, buff.name, {
        fontFamily: "Georgia",
        fontSize: "13px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(0.5);
    });
  }

  drawStatus() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.statusText = this.add.text(width / 2, height * 0.91, "Select an elf. Choose up to 3 buffs.", {
      fontFamily: "Georgia",
      fontSize: "20px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    const button = this.add.text(width / 2, height * 0.965, "CONTINUE", {
      fontFamily: "Georgia",
      fontSize: "22px",
      color: "#ffffff",
      backgroundColor: "#8b0000",
      padding: { x: 28, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    button.on("pointerdown", () => {
      if (!this.selectedClassId) return;
      this.registry.set("selectedBuffs", this.selectedBuffs);
      this.scene.start("BattleScene");
    });
  }

  selectClass(cls) {
    this.selectedClassId = cls.id;
    this.registry.set("selectedClassId", cls.id);
    this.refreshStatus();
  }

  toggleBuff(buff) {
    const exists = this.selectedBuffs.find(item => item.id === buff.id);

    if (exists) {
      this.selectedBuffs = this.selectedBuffs.filter(item => item.id !== buff.id);
    } else if (this.selectedBuffs.length < 3) {
      this.selectedBuffs.push({ id: buff.id, tier: 1 });
    }

    this.refreshStatus();
  }

  refreshStatus() {
    const classText = this.selectedClassId ? `Class: ${this.selectedClassId}` : "Select an elf";
    this.statusText?.setText(`${classText}. Buffs ${this.selectedBuffs.length} / 3.`);
  }
}
