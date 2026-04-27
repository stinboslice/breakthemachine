import Phaser from "phaser";

const BUFF_ICON_KEYS = {
  hp_boost: "icon_buff_hp",
  damage_boost: "icon_buff_damage",
  speed_boost: "icon_buff_speed",
  crit_boost: "icon_buff_crit",
  block: "icon_buff_block",
  double_strike: "icon_buff_double_strike"
};

function fitImage(image, maxWidth, maxHeight) {
  const sourceWidth = image.width || 1;
  const sourceHeight = image.height || 1;
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  image.setScale(scale);
}

export class SetupScene extends Phaser.Scene {
  constructor() {
    super("SetupScene");
    this.selectedClassId = null;
    this.selectedBuffs = [];
    this.selectionText = null;
    this.continueButton = null;
  }

  getDataStore() {
    let dataStore = this.registry.get("dataStore");

    if (dataStore?.data?.classes?.length) return dataStore;

    dataStore = {
      data: {
        classes: this.cache.json.get("classes") || [],
        weapons: this.cache.json.get("weapons") || [],
        buffs: this.cache.json.get("buffs") || [],
        enemies: this.cache.json.get("enemies") || [],
        levels: this.cache.json.get("levels") || [],
        dialogue: this.cache.json.get("dialogue") || [],
        specials: this.cache.json.get("specials") || [],
        hallways: this.cache.json.get("hallways") || [],
        roomRewards: this.cache.json.get("room_rewards") || null
      }
    };

    this.registry.set("dataStore", dataStore);
    return dataStore;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    const dataStore = this.getDataStore();
    const classes = dataStore.data.classes;
    const buffs = dataStore.data.buffs;

    this.selectedBuffs = [];

    if (!classes.length) {
      this.add.text(width / 2, height / 2, "CLASSES JSON NOT LOADED", {
        fontFamily: "Georgia",
        fontSize: "32px",
        color: "#ff4444"
      }).setOrigin(0.5);
      return;
    }

    this.add.image(width / 2, height / 2, "bg_cutscene_default")
      .setDisplaySize(width, height);

    this.add.text(width / 2, 48, "CHOOSE YOUR ELF", {
      fontFamily: "Georgia",
      fontSize: "38px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    this.drawClassCards(classes);
    this.drawBuffShelf(buffs);
    this.drawBottomStatus();
  }

  drawClassCards(classes) {
    const width = this.scale.width;
    const height = this.scale.height;

    classes.forEach((cls, index) => {
      const x = width * 0.25 + index * width * 0.25;
      const y = height * 0.35;

      const panel = this.add.image(x, y, "ui_class_panel")
        .setInteractive({ useHandCursor: true });

      fitImage(panel, 235, 310);

      const spriteKey = `player_${cls.id}_idle`;
      const sprite = this.add.image(x, y + 38, spriteKey)
        .setInteractive({ useHandCursor: true });

      fitImage(sprite, 118, 170);

      const name = this.add.text(x, y + 142, cls.name, {
        fontFamily: "Georgia",
        fontSize: "22px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5);

      const stats = this.add.text(x, y + 168, `HP ${cls.hp}  ATK ${cls.attackMultiplier}  SPD ${cls.speed}`, {
        fontFamily: "Georgia",
        fontSize: "13px",
        color: "#c9b56d",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(0.5);

      const chooseClass = () => {
        this.selectedClassId = cls.id;
        this.registry.set("selectedClassId", cls.id);
        this.updateBottomStatus(cls);
      };

      panel.on("pointerdown", chooseClass);
      sprite.on("pointerdown", chooseClass);
      name.setInteractive({ useHandCursor: true }).on("pointerdown", chooseClass);
      stats.setInteractive({ useHandCursor: true }).on("pointerdown", chooseClass);
    });
  }

  drawBuffShelf(buffs) {
    const width = this.scale.width;
    const height = this.scale.height;

    const shelf = this.add.image(width / 2, height * 0.74, "ui_buff_shelf");
    fitImage(shelf, 760, 180);

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

      const iconKey = BUFF_ICON_KEYS[buff.id];

      if (this.textures.exists(iconKey)) {
        const icon = this.add.image(x, y - 20, iconKey)
          .setInteractive({ useHandCursor: true });

        fitImage(icon, 62, 62);

        icon.on("pointerdown", () => {
          this.toggleBuff(buff);
        });
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

  toggleBuff(buff) {
    const exists = this.selectedBuffs.find(item => item.id === buff.id);

    if (exists) {
      this.selectedBuffs = this.selectedBuffs.filter(item => item.id !== buff.id);
    } else if (this.selectedBuffs.length < 3) {
      this.selectedBuffs.push({ id: buff.id, tier: 1 });
    }

    this.registry.set("selectedBuffs", this.selectedBuffs);
    this.refreshSelectionText();
  }

  drawBottomStatus() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.selectionText = this.add.text(width / 2, height * 0.91, "Select an elf. Choose up to 3 buffs.", {
      fontFamily: "Georgia",
      fontSize: "20px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.continueButton = this.add.image(width / 2, height * 0.965, "button_continue")
      .setInteractive({ useHandCursor: true });

    fitImage(this.continueButton, 260, 58);

    this.continueButton.on("pointerdown", () => {
      if (!this.selectedClassId) return;
      this.scene.start("BattleScene");
    });
  }

  updateBottomStatus(cls) {
    this.selectionText.setText(`${cls.name} selected. Buffs ${this.selectedBuffs.length} / 3.`);
  }

  refreshSelectionText() {
    const dataStore = this.getDataStore();
    const cls = dataStore.data.classes.find(item => item.id === this.selectedClassId);

    if (cls) {
      this.updateBottomStatus(cls);
    } else {
      this.selectionText.setText(`Select an elf. Buffs ${this.selectedBuffs.length} / 3.`);
    }
  }
}
