import Phaser from "phaser";

const LAUNCH_CLASSES = [
  {
    id: "vanguard",
    characterName: "Noah",
    className: "Vanguard",
    hp: 130,
    attackMultiplier: 0.9,
    speed: 0.8
  },
  {
    id: "berserker",
    characterName: "Rory",
    className: "Berserker",
    hp: 110,
    attackMultiplier: 1.2,
    speed: 1.0
  },
  {
    id: "rogue",
    characterName: "Charlotte",
    className: "Rogue",
    hp: 85,
    attackMultiplier: 1.0,
    speed: 1.3
  }
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
  const sourceWidth = frame?.width || image.width || 1;
  const sourceHeight = frame?.height || image.height || 1;
  image.setScale(Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight));
}

export class SetupScene extends Phaser.Scene {
  constructor() {
    super("SetupScene");

    this.selectedClass = null;
    this.selectedBuffs = [];
    this.objects = [];
    this.detailObjects = [];
  }

  create() {
    this.dataStore = this.registry.get("dataStore") || window.ELF_DATASTORE || null;
    this.buffs = this.dataStore?.data?.buffs || this.cache.json.get("buffs") || [];

    this.showClassScreen();
  }

  addTracked(obj) {
    this.objects.push(obj);
    return obj;
  }

  clearTracked() {
    this.objects.forEach(obj => obj.destroy());
    this.objects = [];
    this.detailObjects.forEach(obj => obj.destroy());
    this.detailObjects = [];
  }

  showClassScreen() {
    this.clearTracked();

    const width = this.scale.width;
    const height = this.scale.height;

    this.addTracked(
      this.add.image(width / 2, height / 2, "bg_cutscene_default")
        .setDisplaySize(width, height)
    );

    this.addTracked(
      this.add.text(width / 2, 48, "CHOOSE YOUR ELF", {
        fontFamily: "Georgia",
        fontSize: "38px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 6
      }).setOrigin(0.5)
    );

    LAUNCH_CLASSES.forEach((cls, index) => {
      const x = width * 0.25 + index * width * 0.25;
      const y = height * 0.43;

      const panel = this.addTracked(
        this.add.image(x, y, "ui_class_panel")
          .setInteractive({ useHandCursor: true })
      );
      fitImage(this, panel, 255, 350);

      const spriteKey = `player_${cls.id}_idle`;

      const sprite = this.addTracked(
        this.add.image(x, y + 42, spriteKey)
          .setInteractive({ useHandCursor: true })
      );
      fitImage(this, sprite, 145, 205);

      this.addTracked(
        this.add.text(x, y - 165, cls.characterName, {
          fontFamily: "Georgia",
          fontSize: "24px",
          color: "#f4e7c1",
          stroke: "#000000",
          strokeThickness: 4
        }).setOrigin(0.5)
      );

      this.addTracked(
        this.add.text(x, y + 178, cls.className, {
          fontFamily: "Georgia",
          fontSize: "22px",
          color: "#f4e7c1",
          stroke: "#000000",
          strokeThickness: 4
        }).setOrigin(0.5)
      );

      this.addTracked(
        this.add.text(x, y + 204, `HP ${cls.hp} | ATK ${cls.attackMultiplier} | SPD ${cls.speed}`, {
          fontFamily: "Georgia",
          fontSize: "13px",
          color: "#c9b56d",
          stroke: "#000000",
          strokeThickness: 3
        }).setOrigin(0.5)
      );

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

    this.addTracked(
      this.add.image(width / 2, height / 2, "bg_cutscene_default")
        .setDisplaySize(width, height)
    );

    this.addTracked(
      this.add.text(width / 2, 44, `${this.selectedClass.characterName} selected`, {
        fontFamily: "Georgia",
        fontSize: "32px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 6
      }).setOrigin(0.5)
    );

    const shelf = this.addTracked(
      this.add.image(width / 2, height * 0.42, "ui_buff_shelf")
    );
    fitImage(this, shelf, 760, 280);

    const positions = [
      [-230, -58],
      [0, -58],
      [230, -58],
      [-230, 68],
      [0, 68],
      [230, 68]
    ];

    this.buffs.forEach((buff, index) => {
      const key = BUFF_ICON_KEYS[buff.id];
      const pos = positions[index];
      if (!key || !pos) return;

      const x = width / 2 + pos[0];
      const y = height * 0.42 + pos[1];

      const icon = this.addTracked(
        this.add.image(x, y, key)
          .setInteractive({ useHandCursor: true })
      );
      fitImage(this, icon, 78, 78);

      icon.on("pointerdown", () => this.openBuffDetail(buff));
    });

    this.statusText = this.addTracked(
      this.add.text(width / 2, height * 0.78, "Choose up to 3 buffs", {
        fontFamily: "Georgia",
        fontSize: "20px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5)
    );

    const continueButton = this.addTracked(
      this.add.image(width / 2, height * 0.88, "button_continue")
        .setInteractive({ useHandCursor: true })
    );
    fitImage(this, continueButton, 260, 70);

    continueButton.on("pointerdown", () => {
      this.registry.set("selectedBuffs", this.selectedBuffs);
      this.scene.start("BattleScene");
    });
  }

  openBuffDetail(buff) {
    this.detailObjects.forEach(obj => obj.destroy());
    this.detailObjects = [];

    const width = this.scale.width;
    const height = this.scale.height;
    const key = BUFF_ICON_KEYS[buff.id];

    const addDetail = obj => {
      this.detailObjects.push(obj);
      return obj;
    };

    const panel = addDetail(this.add.image(width / 2, height / 2, "ui_buff_detail_panel"));
    fitImage(this, panel, 470, 610);

    addDetail(
      this.add.text(width / 2, height * 0.19, buff.name, {
        fontFamily: "Georgia",
        fontSize: "26px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 5
      }).setOrigin(0.5)
    );

    const icon = addDetail(this.add.image(width / 2, height * 0.34, key));
    fitImage(this, icon, 120, 120);

    addDetail(
      this.add.text(width / 2, height * 0.47, buff.description, {
        fontFamily: "Georgia",
        fontSize: "16px",
        color: "#ffffff",
        wordWrap: { width: 330 },
        align: "center"
      }).setOrigin(0.5)
    );

    const tierText = addDetail(
      this.add.text(width / 2, height * 0.66, "Tier 1 selected | Burn 1", {
        fontFamily: "Georgia",
        fontSize: "17px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(0.5)
    );

    [1, 2, 3].forEach((tier, index) => {
      const button = addDetail(
        this.add.image(width / 2 - 130 + index * 130, height * 0.565, `detail_panel_button_t${tier}`)
          .setInteractive({ useHandCursor: true })
      );
      fitImage(this, button, 120, 54);

      button.on("pointerdown", () => {
        tierText.setText(`Tier ${tier} selected | Burn ${tier}`);
        this.activeTier = tier;
      });
    });

    const selectButton = addDetail(
      this.add.image(width / 2 - 90, height * 0.79, "detail_panel_button_select")
        .setInteractive({ useHandCursor: true })
    );
    fitImage(this, selectButton, 150, 60);

    selectButton.on("pointerdown", () => {
      const exists = this.selectedBuffs.find(item => item.id === buff.id);
      if (!exists && this.selectedBuffs.length < 3) {
        this.selectedBuffs.push({ id: buff.id, tier: this.activeTier || 1 });
      }

      this.statusText.setText(`Buffs selected ${this.selectedBuffs.length} / 3`);
      this.closeBuffDetail();
    });

    const closeButton = addDetail(
      this.add.image(width / 2 + 90, height * 0.79, "detail_panel_button_close")
        .setInteractive({ useHandCursor: true })
    );
    fitImage(this, closeButton, 150, 60);

    closeButton.on("pointerdown", () => this.closeBuffDetail());
  }

  closeBuffDetail() {
    this.detailObjects.forEach(obj => obj.destroy());
    this.detailObjects = [];
  }
}
