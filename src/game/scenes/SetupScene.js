import Phaser from "phaser";

const CHARACTER_NAMES = {
  vanguard: "Noah",
  berserker: "Rory",
  rogue: "Charlotte"
};

const CLASS_ORDER = ["vanguard", "berserker", "rogue"];

const BUFF_ICON_KEYS = {
  hp_boost: "icon_buff_hp",
  damage_boost: "icon_buff_damage",
  speed_boost: "icon_buff_speed",
  crit_boost: "icon_buff_crit",
  block: "icon_buff_block",
  double_strike: "icon_buff_double_strike"
};

const BUFF_TIER_TEXT = {
  hp_boost: {
    1: "Tier 1: +10 HP | Burn 1",
    2: "Tier 2: +15 HP | Burn 2",
    3: "Tier 3: +20 HP | Burn 3"
  },
  damage_boost: {
    1: "Tier 1: +5 percent damage | Burn 1",
    2: "Tier 2: +7.5 percent damage | Burn 2",
    3: "Tier 3: +10 percent damage | Burn 3"
  },
  speed_boost: {
    1: "Tier 1: +5 percent speed | Burn 1",
    2: "Tier 2: +7.5 percent speed | Burn 2",
    3: "Tier 3: +10 percent speed | Burn 3"
  },
  crit_boost: {
    1: "Tier 1: +5 percent crit | Burn 1",
    2: "Tier 2: +7.5 percent crit | Burn 2",
    3: "Tier 3: +10 percent crit | Burn 3"
  },
  block: {
    1: "Tier 1: 10 percent block chance | Burn 1",
    2: "Tier 2: 15 percent block chance | Burn 2",
    3: "Tier 3: 20 percent block chance | Burn 3"
  },
  double_strike: {
    1: "Tier 1: 7.5 percent extra strike chance | Burn 1",
    2: "Tier 2: 11 percent extra strike chance | Burn 2",
    3: "Tier 3: 15 percent extra strike chance | Burn 3"
  }
};

function fitImage(scene, image, maxWidth, maxHeight) {
  const frame = scene.textures.getFrame(image.texture.key);
  const w = frame?.width || image.width || 1;
  const h = frame?.height || image.height || 1;
  image.setScale(Math.min(maxWidth / w, maxHeight / h));
}

export class SetupScene extends Phaser.Scene {
  constructor() {
    super("SetupScene");
    this.selectedClass = null;
    this.selectedBuffs = [];
    this.activeBuff = null;
    this.activeTier = 1;
    this.screenObjects = [];
  }

  create() {
    this.dataStore = this.registry.get("dataStore") || window.ELF_DATASTORE;
    this.classes = this.getCleanClasses();
    this.buffs = this.dataStore?.data?.buffs || this.cache.json.get("buffs") || [];
    this.selectedBuffs = [];

    this.showClassScreen();
  }

  clearScreen() {
    this.screenObjects.forEach(obj => obj.destroy());
    this.screenObjects = [];
  }

  addObj(obj) {
    this.screenObjects.push(obj);
    return obj;
  }

  getCleanClasses() {
    const loaded = this.dataStore?.data?.classes || this.cache.json.get("classes") || [];
    return CLASS_ORDER.map(id => loaded.find(cls => cls.id === id)).filter(Boolean);
  }

  showClassScreen() {
    this.clearScreen();

    const width = this.scale.width;
    const height = this.scale.height;

    this.addObj(this.add.image(width / 2, height / 2, "bg_cutscene_default")
      .setDisplaySize(width, height));

    this.addObj(this.add.text(width / 2, 48, "CHOOSE YOUR ELF", {
      fontFamily: "Georgia",
      fontSize: "38px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5));

    this.classes.forEach((cls, index) => {
      const x = width * 0.25 + index * width * 0.25;
      const y = height * 0.43;

      const panel = this.addObj(this.add.image(x, y, "ui_class_panel")
        .setInteractive({ useHandCursor: true }));
      fitImage(this, panel, 255, 350);

      const sprite = this.addObj(this.add.image(x, y + 42, `player_${cls.id}_idle`)
        .setInteractive({ useHandCursor: true }));
      fitImage(this, sprite, 145, 205);

      this.addObj(this.add.text(x, y - 165, CHARACTER_NAMES[cls.id], {
        fontFamily: "Georgia",
        fontSize: "24px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5));

      this.addObj(this.add.text(x, y + 178, cls.name, {
        fontFamily: "Georgia",
        fontSize: "22px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5));

      this.addObj(this.add.text(x, y + 204, `HP ${cls.hp} | ATK ${cls.attackMultiplier} | SPD ${cls.speed}`, {
        fontFamily: "Georgia",
        fontSize: "13px",
        color: "#c9b56d",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(0.5));

      const select = () => {
        this.selectedClass = cls;
        this.registry.set("selectedClassId", cls.id);
        this.showBuffScreen();
      };

      panel.on("pointerdown", select);
      sprite.on("pointerdown", select);
    });
  }

  showBuffScreen() {
    this.clearScreen();

    const width = this.scale.width;
    const height = this.scale.height;

    this.addObj(this.add.image(width / 2, height / 2, "bg_cutscene_default")
      .setDisplaySize(width, height));

    this.addObj(this.add.text(width / 2, 46, `${CHARACTER_NAMES[this.selectedClass.id]} selected`, {
      fontFamily: "Georgia",
      fontSize: "32px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5));

    const shelf = this.addObj(this.add.image(width / 2, height * 0.42, "ui_buff_shelf"));
    fitImage(this, shelf, 760, 280);

    this.buffs.forEach((buff, index) => {
      const positions = [
        [-230, -58], [0, -58], [230, -58],
        [-230, 68], [0, 68], [230, 68]
      ];

      const [ox, oy] = positions[index] || [0, 0];
      const x = width / 2 + ox;
      const y = height * 0.42 + oy;
      const key = BUFF_ICON_KEYS[buff.id];

      if (!key || !this.textures.exists(key)) return;

      const icon = this.addObj(this.add.image(x, y, key)
        .setInteractive({ useHandCursor: true }));
      fitImage(this, icon, 78, 78);

      icon.on("pointerdown", () => this.openBuffDetail(buff));
    });

    this.statusText = this.addObj(this.add.text(width / 2, height * 0.78, "Choose up to 3 buffs", {
      fontFamily: "Georgia",
      fontSize: "20px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5));

    const continueButton = this.addObj(this.add.image(width / 2, height * 0.88, "button_continue")
      .setInteractive({ useHandCursor: true }));
    fitImage(this, continueButton, 260, 70);

    continueButton.on("pointerdown", () => {
      this.registry.set("selectedBuffs", this.selectedBuffs);
      this.scene.start("BattleScene");
    });
  }

  openBuffDetail(buff) {
    this.activeBuff = buff;
    this.activeTier = 1;

    if (this.detailObjects) {
      this.detailObjects.forEach(obj => obj.destroy());
    }

    this.detailObjects = [];

    const width = this.scale.width;
    const height = this.scale.height;

    const addDetail = obj => {
      this.detailObjects.push(obj);
      return obj;
    };

    const panel = addDetail(this.add.image(width / 2, height / 2, "ui_buff_detail_panel"));
    fitImage(this, panel, 470, 610);

    addDetail(this.add.text(width / 2, height * 0.19, buff.name, {
      fontFamily: "Georgia",
      fontSize: "26px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5));

    const icon = addDetail(this.add.image(width / 2, height * 0.34, BUFF_ICON_KEYS[buff.id]));
    fitImage(this, icon, 120, 120);

    addDetail(this.add.text(width / 2, height * 0.47, buff.description, {
      fontFamily: "Georgia",
      fontSize: "16px",
      color: "#ffffff",
      wordWrap: { width: 330 },
      align: "center"
    }).setOrigin(0.5));

    const tierText = addDetail(this.add.text(width / 2, height * 0.66, BUFF_TIER_TEXT[buff.id][1], {
      fontFamily: "Georgia",
      fontSize: "17px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5));

    [1, 2, 3].forEach((tier, index) => {
      const key = `detail_panel_button_t${tier}`;
      const x = width / 2 - 130 + index * 130;
      const button = addDetail(this.add.image(x, height * 0.565, key)
        .setInteractive({ useHandCursor: true }));
      fitImage(this, button, 120, 54);

      button.on("pointerdown", () => {
        this.activeTier = tier;
        tierText.setText(BUFF_TIER_TEXT[buff.id][tier]);
      });
    });

    const selectKey = this.selectedBuffs.find(item => item.id === buff.id)
      ? "detail_panel_button_update"
      : "detail_panel_button_select";

    const selectButton = addDetail(this.add.image(width / 2 - 90, height * 0.79, selectKey)
      .setInteractive({ useHandCursor: true }));
    fitImage(this, selectButton, 150, 60);

    selectButton.on("pointerdown", () => {
      const exists = this.selectedBuffs.find(item => item.id === buff.id);

      if (exists) {
        this.selectedBuffs = this.selectedBuffs.filter(item => item.id !== buff.id);
      } else if (this.selectedBuffs.length < 3) {
        this.selectedBuffs.push({ id: buff.id, tier: this.activeTier });
      }

      this.statusText.setText(`Buffs selected ${this.selectedBuffs.length} / 3`);
      this.closeBuffDetail();
    });

    const closeButton = addDetail(this.add.image(width / 2 + 90, height * 0.79, "detail_panel_button_close")
      .setInteractive({ useHandCursor: true }));
    fitImage(this, closeButton, 150, 60);

    closeButton.on("pointerdown", () => this.closeBuffDetail());
  }

  closeBuffDetail() {
    if (!this.detailObjects) return;
    this.detailObjects.forEach(obj => obj.destroy());
    this.detailObjects = [];
  }
}
