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
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  image.setScale(scale);
}

export class SetupScene extends Phaser.Scene {
  constructor() {
    super("SetupScene");
    this.selectedClass = null;
    this.selectedPanel = null;
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

    this.add.text(width / 2, 56, "CHOOSE YOUR ELF", {
      fontFamily: "Georgia",
      fontSize: "38px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    classes.forEach((cls, index) => {
      const x = width * 0.25 + index * width * 0.25;
      const y = height * 0.33;
      const spriteKey = `player_${cls.id}_idle`;

      const sprite = this.add.image(x, y, spriteKey)
        .setInteractive({ useHandCursor: true });

      fitImage(sprite, 180, 210);

      sprite.on("pointerdown", () => {
        this.registry.set("selectedClassId", cls.id);
        this.selectedClass = cls.id;
        this.showLoadoutPanel(cls);
      });

      this.add.text(x, y + 132, cls.name, {
        fontFamily: "Georgia",
        fontSize: "25px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5);

      this.add.text(x, y + 162, `HP ${cls.hp}  ATK ${cls.attackMultiplier}  SPD ${cls.speed}`, {
        fontFamily: "Georgia",
        fontSize: "15px",
        color: "#c9b56d",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(0.5);
    });

    this.drawBuffShelf(buffs);
  }

  drawBuffShelf(buffs) {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.rectangle(width / 2, height * 0.76, width * 0.88, 165, 0x050509, 0.74)
      .setStrokeStyle(2, 0xc9b56d);

    this.add.text(width / 2, height * 0.66, "BUFF SHELF", {
      fontFamily: "Georgia",
      fontSize: "25px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5);

    buffs.forEach((buff, index) => {
      const spacing = 128;
      const startX = width / 2 - ((buffs.length - 1) * spacing) / 2;
      const x = startX + index * spacing;
      const y = height * 0.76;

      const iconKey = BUFF_ICON_KEYS[buff.id];

      if (this.textures.exists(iconKey)) {
        const icon = this.add.image(x, y - 14, iconKey)
          .setInteractive({ useHandCursor: true });

        fitImage(icon, 70, 70);
      }

      this.add.text(x, y + 52, buff.name, {
        fontFamily: "Georgia",
        fontSize: "14px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(0.5);
    });
  }

  showLoadoutPanel(cls) {
    const width = this.scale.width;
    const height = this.scale.height;

    if (this.selectedPanel) this.selectedPanel.destroy(true);

    this.selectedPanel = this.add.container(0, 0);

    const panel = this.add.rectangle(width / 2, height * 0.54, 520, 96, 0x050509, 0.86)
      .setStrokeStyle(2, 0xc9b56d);

    const text = this.add.text(width / 2, height * 0.515, `${cls.name} selected`, {
      fontFamily: "Georgia",
      fontSize: "23px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    const button = this.add.text(width / 2, height * 0.57, "INITIATE SIMULATION", {
      fontFamily: "Georgia",
      fontSize: "19px",
      color: "#ffffff",
      backgroundColor: "#8b0000",
      padding: { x: 22, y: 8 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on("pointerdown", () => {
      this.scene.start("BattleScene");
    });

    this.selectedPanel.add([panel, text, button]);
  }
}
