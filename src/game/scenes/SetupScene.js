import Phaser from "phaser";

import { buildRunState } from "../systems/RunBuilder.js";

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
  { id: "block", name: "Block", description: "Chance to negate incoming attacks." },
  { id: "double_strike", name: "Double Strike", description: "Chance to perform an extra attack." }
];

const BUFF_ICON_KEYS = {
  hp_boost: "icon_buff_hp",
  damage_boost: "icon_buff_damage",
  speed_boost: "icon_buff_speed",
  crit_boost: "icon_buff_crit",
  block: "icon_buff_block",
  double_strike: "icon_buff_double_strike"
};

const BUFF_TIER_DETAILS = {
  hp_boost: {
    1: "Tier 1: +10 HP | Burn 1",
    2: "Tier 2: +15 HP | Burn 2",
    3: "Tier 3: +20 HP | Burn 3"
  },
  damage_boost: {
    1: "Tier 1: +5% damage | Burn 1",
    2: "Tier 2: +7.5% damage | Burn 2",
    3: "Tier 3: +10% damage | Burn 3"
  },
  speed_boost: {
    1: "Tier 1: +5% speed | Burn 1",
    2: "Tier 2: +7.5% speed | Burn 2",
    3: "Tier 3: +10% speed | Burn 3"
  },
  crit_boost: {
    1: "Tier 1: +5% crit | Burn 1",
    2: "Tier 2: +7.5% crit | Burn 2",
    3: "Tier 3: +10% crit | Burn 3"
  },
  block: {
    1: "Tier 1: 10% block chance | Burn 1",
    2: "Tier 2: 15% block chance | Burn 2",
    3: "Tier 3: 20% block chance | Burn 3"
  },
  double_strike: {
    1: "Tier 1: 7.5% extra strike chance | Burn 1",
    2: "Tier 2: 11% extra strike chance | Burn 2",
    3: "Tier 3: 15% extra strike chance | Burn 3"
  }
};

function fitImage(scene, image, maxWidth, maxHeight) {
  const frame = scene.textures.getFrame(image.texture.key);
  const w = frame?.width || 1;
  const h = frame?.height || 1;
  image.setScale(Math.min(maxWidth / w, maxHeight / h));
}

export class SetupScene extends Phaser.Scene {
  constructor() {
    super("SetupScene");

    this.selectedClass = null;
    this.selectedBuffs = [];
    this.activeTier = 1;
this.selectedWeaponTier = "base";

    this.objects = [];
    this.detailObjects = [];
  }

  // 🔥 SAFETY LOADER (prevents missing assets on GitHub Pages)
  preload() {
    Object.values(BUFF_ICON_KEYS).forEach(key => {
      if (!this.textures.exists(key)) {
        this.load.image(key, `assets/icons/${key}.png`);
      }
    });
  }

  create() {
  this.selectedClass = null;
  this.selectedBuffs = [];
  this.activeTier = 1;
  this.selectedWeaponTier = "base";
  this.objects = [];
  this.detailObjects = [];

  this.registry.remove("runState");
  this.registry.remove("selectedClassId");
  this.registry.remove("selectedBuffs");

  this.buffs = LAUNCH_BUFFS;
  this.showClassScreen();
}

  // ---------- UTIL ----------
  addTracked(obj) {
    this.objects.push(obj);
    return obj;
  }

  clearTracked() {
    this.objects.forEach(o => o.destroy());
    this.objects = [];
    this.closeBuffDetail();
  }

  // ---------- CLASS SCREEN ----------
  showClassScreen() {
    this.clearTracked();

    const w = this.scale.width;
    const h = this.scale.height;

    this.addTracked(this.add.image(w/2, h/2, "bg_cutscene_default").setDisplaySize(w,h));

    this.addTracked(this.add.text(w/2, 50, "CHOOSE YOUR ELF", {
      fontFamily: "Georgia",
      fontSize: "38px",
      color: "#f4e7c1",
      stroke: "#000",
      strokeThickness: 6
    }).setOrigin(0.5));

    LAUNCH_CLASSES.forEach((cls, i) => {
      const x = w * 0.25 + i * w * 0.25;
      const y = h * 0.45;

      const panel = this.addTracked(this.add.image(x, y, "ui_class_panel").setInteractive());
      fitImage(this, panel, 280, 400);

      const sprite = this.addTracked(this.add.image(x, y + 50, `player_${cls.id}_idle`).setInteractive());
      fitImage(this, sprite, 210, 285);

      this.addTracked(this.add.text(x, y - 170, cls.characterName, {
        fontSize: "22px",
        color: "#f4e7c1",
        stroke: "#000",
        strokeThickness: 4
      }).setOrigin(0.5));

      this.addTracked(this.add.text(x, y + 180, cls.className, {
        fontSize: "20px",
        color: "#f4e7c1"
      }).setOrigin(0.5));

      this.addTracked(this.add.text(x, y + 205,
        `HP ${cls.hp} | ATK ${cls.attackMultiplier} | SPD ${cls.speed}`,
        { fontSize: "13px", color: "#c9b56d" }
      ).setOrigin(0.5));

      const select = () => {
        this.selectedClass = cls;
        this.showBuffScreen();
      };

      panel.on("pointerdown", select);
      sprite.on("pointerdown", select);
    });
  }

  // ---------- BUFF SCREEN ----------
  showBuffScreen() {
  this.clearTracked();

  const w = this.scale.width;
  const h = this.scale.height;

  this.selectedWeaponTier = this.selectedWeaponTier || "base";

  this.addTracked(this.add.image(w / 2, h / 2, "bg_cutscene_default").setDisplaySize(w, h));

  this.addTracked(this.add.text(w / 2, 42, `${this.selectedClass.characterName} selected`, {
    fontSize: "32px",
    color: "#f4e7c1",
    stroke: "#000",
    strokeThickness: 6
  }).setOrigin(0.5));

  const shelf = this.addTracked(this.add.image(w / 2, h * 0.41, "ui_buff_shelf"));
  fitImage(this, shelf, 980, 380);

  const positions = [
    [-140, -60], [0, -60], [140, -60],
    [-140, 70], [0, 70], [140, 70]
  ];

  this.buffs.forEach((buff, i) => {
    const [ox, oy] = positions[i];
    const icon = this.addTracked(
      this.add.image(w / 2 + ox, h * 0.41 + oy, BUFF_ICON_KEYS[buff.id])
        .setInteractive({ useHandCursor: true })
    );

    fitImage(this, icon, 96, 96);
    icon.on("pointerdown", () => this.openBuffDetail(buff));
  });

  this.statusText = this.addTracked(
    this.add.text(w / 2, h * 0.705, `${this.selectedBuffs.length} / 3 buffs selected`, {
      fontSize: "20px",
      color: "#f4e7c1",
      stroke: "#000",
      strokeThickness: 4
    }).setOrigin(0.5)
  );

  this.weaponTierText = this.addTracked(
    this.add.text(w / 2, h * 0.755, "Weapon Tier: BASE", {
      fontSize: "18px",
      color: "#f4e7c1",
      stroke: "#000",
      strokeThickness: 4
    }).setOrigin(0.5)
  );

  const tierLabels = [
    { label: "BASE", value: "base" },
    { label: "TIER 1", value: "tier1" },
    { label: "TIER 2", value: "tier2" },
    { label: "TIER 3", value: "tier3" }
  ];

  tierLabels.forEach((tier, index) => {
    const tierButton = this.addTracked(
      this.add.text(w / 2 - 210 + index * 140, h * 0.805, tier.label, {
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: tier.value === this.selectedWeaponTier ? "#7b1113" : "#222222",
        padding: { x: 14, y: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    );

    tierButton.on("pointerdown", () => {
      this.selectedWeaponTier = tier.value;
      this.weaponTierText.setText(`Weapon Tier: ${tier.label}`);
    });
  });

  this.continueButton = this.addTracked(
    this.add.image(w / 2, h * 0.91, "button_continue").setInteractive({ useHandCursor: true })
  );

  fitImage(this, this.continueButton, 260, 70);

  this.continueButton.on("pointerdown", () => {
    if (this.detailObjects.length) return;

    const dataStore = this.registry.get("dataStore") || window.ELF_DATASTORE;

    const runState = buildRunState({
      selectedClass: this.selectedClass,
      selectedBuffs: this.selectedBuffs,
      weaponTier: this.selectedWeaponTier,
      dataStore
    });

    this.registry.set("runState", runState);
    this.registry.set("selectedClassId", this.selectedClass.id);
    this.registry.set("selectedBuffs", this.selectedBuffs);

    this.scene.start("RunIntroScene");
  });
}

  // ---------- DETAIL PANEL ----------
  openBuffDetail(buff) {
  this.closeBuffDetail();
  this.activeTier = 1;

  const w = this.scale.width;
  const h = this.scale.height;
  const add = o => (this.detailObjects.push(o), o);

  const blocker = add(
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.01)
      .setInteractive()
      .setDepth(1000)
  );

  const panel = add(this.add.image(w / 2, h / 2, "ui_buff_detail_panel").setDepth(1001));
  fitImage(this, panel, 500, 660);

  add(this.add.text(w / 2, h * 0.120, buff.name, {
    fontSize: "28px",
    color: "#f4e7c1",
    stroke: "#000",
    strokeThickness: 4
  }).setOrigin(0.5).setDepth(1002));

  const icon = add(this.add.image(w / 2, h * 0.295, BUFF_ICON_KEYS[buff.id]).setDepth(1002));
  fitImage(this, icon, 128, 128);

  add(this.add.text(w / 2, h * 0.5, buff.description, {
    fontSize: "16px",
    color: "#ffffff",
    wordWrap: { width: 330 },
    align: "center"
  }).setOrigin(0.5).setDepth(1002));

  const tierText = add(this.add.text(w / 2, h * 0.7, BUFF_TIER_DETAILS[buff.id][1], {
    fontSize: "17px",
    color: "#f4e7c1",
    stroke: "#000",
    strokeThickness: 3,
    wordWrap: { width: 330 },
    align: "center"
  }).setOrigin(0.5).setDepth(1002));

  [1, 2, 3].forEach((tier, i) => {
    const btn = add(
      this.add.image(w / 2 - 145 + i * 145, h * 0.545, `detail_panel_button_t${tier}`)
        .setInteractive({ useHandCursor: true })
        .setDepth(1002)
    );

    fitImage(this, btn, 130, 58);

    btn.on("pointerdown", () => {
      this.activeTier = tier;
      tierText.setText(BUFF_TIER_DETAILS[buff.id][tier]);
    });
  });

  const alreadySelected = this.selectedBuffs.some(b => b.id === buff.id);
  const selectKey = alreadySelected ? "detail_panel_button_update" : "detail_panel_button_select";

  const selectBtn = add(
    this.add.image(w / 2 - 105, h * 0.805, selectKey)
      .setInteractive({ useHandCursor: true })
      .setDepth(1002)
  );

  fitImage(this, selectBtn, 165, 66);

  selectBtn.on("pointerdown", () => {
    const exists = this.selectedBuffs.find(b => b.id === buff.id);

    if (exists) {
      this.selectedBuffs = this.selectedBuffs.filter(b => b.id !== buff.id);
    } else if (this.selectedBuffs.length < 3) {
      this.selectedBuffs.push({ id: buff.id, tier: this.activeTier });
    }

    this.statusText.setText(`${this.selectedBuffs.length} / 3 buffs selected`);
    this.closeBuffDetail();
  });

  const closeBtn = add(
    this.add.image(w / 2 + 105, h * 0.805, "detail_panel_button_close")
      .setInteractive({ useHandCursor: true })
      .setDepth(1002)
  );

  fitImage(this, closeBtn, 165, 66);

  closeBtn.on("pointerdown", () => this.closeBuffDetail());
}

  closeBuffDetail() {
    this.detailObjects.forEach(o=>o.destroy());
    this.detailObjects = [];
  }
}
