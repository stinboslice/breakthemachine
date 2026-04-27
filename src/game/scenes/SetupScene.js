import Phaser from "phaser";

const LAUNCH_CLASSES = [
  { id: "vanguard", characterName: "Noah", className: "Vanguard", hp: 130, attackMultiplier: 0.9, speed: 0.8 },
  { id: "berserker", characterName: "Rory", className: "Berserker", hp: 110, attackMultiplier: 1.2, speed: 1.0 },
  { id: "rogue", characterName: "Charlotte", className: "Rogue", hp: 85, attackMultiplier: 1.0, speed: 1.3 }
];

const LAUNCH_BUFFS = [
  { id: "hp_boost", name: "HP Boost", description: "Raises maximum health before entering the run." },
  { id: "damage_boost", name: "Damage Boost", description: "Increases weapon damage dealt during the run." },
  { id: "speed_boost", name: "Speed Boost", description: "Improves initiative and action speed in combat." },
  { id: "crit_boost", name: "Crit Boost", description: "Raises critical strike chance for stronger bursts." },
  { id: "block", name: "Block", description: "Grants a chance to negate incoming attacks." },
  { id: "double_strike", name: "Double Strike", description: "Adds a chance to follow up with an extra attack." }
];

const BUFF_ICON_KEYS = {
  hp_boost: "icon_buff_hp",
  damage_boost: "icon_buff_damage",
  speed_boost: "icon_buff_speed",
  crit_boost: "icon_buff_crit",
  block: "icon_buff_block",
  double_strike: "icon_buff_double_strike"
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
    this.objects = [];
    this.detailObjects = [];
    this.activeTier = 1;
  }

  create() {
    this.buffs = LAUNCH_BUFFS;
    this.showClassScreen();
  }

  addTracked(obj) {
    this.objects.push(obj);
    return obj;
  }

  clearTracked() {
    this.objects.forEach(obj => obj.destroy());
    this.objects = [];
    this.closeBuffDetail();
  }

  showClassScreen() {
    this.clearTracked();

    const width = this.scale.width;
    const height = this.scale.height;

    this.addTracked(this.add.image(width / 2, height / 2, "bg_cutscene_default").setDisplaySize(width, height));

    this.addTracked(this.add.text(width / 2, 46, "CHOOSE YOUR ELF", {
      fontFamily: "Georgia",
      fontSize: "38px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5));

    LAUNCH_CLASSES.forEach((cls, index) => {
      const x = width * 0.25 + index * width * 0.25;
      const y = height * 0.43;

      const panel = this.addTracked(this.add.image(x, y, "ui_class_panel").setInteractive({ useHandCursor: true }));
      fitImage(this, panel, 285, 390);

      const sprite = this.addTracked(this.add.image(x, y + 58, `player_${cls.id}_idle`).setInteractive({ useHandCursor: true }));
      fitImage(this, sprite, 170, 235);

      this.addTracked(this.add.text(x, y - 172, cls.characterName, {
        fontFamily: "Georgia",
        fontSize: "23px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5));

      this.addTracked(this.add.text(x, y + 182, cls.className, {
        fontFamily: "Georgia",
        fontSize: "21px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5));

      this.addTracked(this.add.text(x, y + 207, `HP ${cls.hp} | ATK ${cls.attackMultiplier} | SPD ${cls.speed}`, {
        fontFamily: "Georgia",
        fontSize: "13px",
        color: "#c9b56d",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(0.5));

      const selectClass = () => {
        this.selectedClass = cls;
        this.registry.set("selectedClassId", cls.id);
        this.showBuffScreen();
      };

      panel.on("pointerdown", selectClass);
      sprite.on("pointerdown", selectClass);
    });
  }

  showBuffScreen() {
    this.clearTracked();

    const width = this.scale.width;
    const height = this.scale.height;

    this.addTracked(this.add.image(width / 2, height / 2, "bg_cutscene_default").setDisplaySize(width, height));

    this.addTracked(this.add.text(width / 2, 42, `${this.selectedClass.characterName} selected`, {
      fontFamily: "Georgia",
      fontSize: "32px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5));

    const shelf = this.addTracked(this.add.image(width / 2, height * 0.43, "ui_buff_shelf"));
    fitImage(this, shelf, 930, 360);

    const positions = [
      [-280, -82], [0, -82], [280, -82],
      [-280, 92], [0, 92], [280, 92]
    ];

    this.buffs.forEach((buff, index) => {
      const [ox, oy] = positions[index];
      const x = width / 2 + ox;
      const y = height * 0.43 + oy;
      const key = BUFF_ICON_KEYS[buff.id];

      const icon = this.addTracked(this.add.image(x, y, key).setInteractive({ useHandCursor: true }));
      fitImage(this, icon, 105, 105);

      icon.on("pointerdown", () => this.openBuffDetail(buff));
    });

    this.statusText = this.addTracked(this.add.text(width / 2, height * 0.78, "Choose up to 3 buffs", {
      fontFamily: "Georgia",
      fontSize: "20px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5));

    const continueButton = this.addTracked(this.add.image(width / 2, height * 0.89, "button_continue").setInteractive({ useHandCursor: true }));
    fitImage(this, continueButton, 280, 78);

    continueButton.on("pointerdown", () => {
      this.registry.set("selectedBuffs", this.selectedBuffs);
      this.scene.start("BattleScene");
    });
  }

  openBuffDetail(buff) {
    this.closeBuffDetail();
    this.activeTier = 1;

    const width = this.scale.width;
    const height = this.scale.height;
    const iconKey = BUFF_ICON_KEYS[buff.id];

    const addDetail = obj => {
      this.detailObjects.push(obj);
      return obj;
    };

    const panel = addDetail(this.add.image(width / 2, height / 2, "ui_buff_detail_panel"));
    fitImage(this, panel, 520, 670);

    addDetail(this.add.text(width / 2, height * 0.17, buff.name, {
      fontFamily: "Georgia",
      fontSize: "28px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5));

    const icon = addDetail(this.add.image(width / 2, height * 0.33, iconKey));
    fitImage(this, icon, 135, 135);

    addDetail(this.add.text(width / 2, height * 0.47, buff.description, {
      fontFamily: "Georgia",
      fontSize: "16px",
      color: "#ffffff",
      wordWrap: { width: 350 },
      align: "center"
    }).setOrigin(0.5));

    const tierText = addDetail(this.add.text(width / 2, height * 0.665, "Tier 1 selected | Burn 1", {
      fontFamily: "Georgia",
      fontSize: "17px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5));

    [1, 2, 3].forEach((tier, index) => {
      const tierButton = addDetail(this.add.image(width / 2 - 145 + index * 145, height * 0.565, `detail_panel_button_t${tier}`)
        .setInteractive({ useHandCursor: true }));
      fitImage(this, tierButton, 130, 58);

      tierButton.on("pointerdown", () => {
        this.activeTier = tier;
        tierText.setText(`Tier ${tier} selected | Burn ${tier}`);
      });
    });

    const alreadySelected = this.selectedBuffs.some(item => item.id === buff.id);
    const selectKey = alreadySelected ? "detail_panel_button_update" : "detail_panel_button_select";

    const selectButton = addDetail(this.add.image(width / 2 - 100, height * 0.80, selectKey)
      .setInteractive({ useHandCursor: true }));
    fitImage(this, selectButton, 165, 66);

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

    const closeButton = addDetail(this.add.image(width / 2 + 100, height * 0.80, "detail_panel_button_close")
      .setInteractive({ useHandCursor: true }));
    fitImage(this, closeButton, 165, 66);

    closeButton.on("pointerdown", () => this.closeBuffDetail());
  }

  closeBuffDetail() {
    this.detailObjects.forEach(obj => obj.destroy());
    this.detailObjects = [];
  }
}
