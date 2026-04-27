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
      fitImage(this, sprite, 180, 260);

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

    this.addTracked(this.add.image(w/2, h/2, "bg_cutscene_default").setDisplaySize(w,h));

    this.addTracked(this.add.text(w/2, 50, `${this.selectedClass.characterName} selected`, {
      fontSize: "32px",
      color: "#f4e7c1",
      stroke: "#000",
      strokeThickness: 6
    }).setOrigin(0.5));

    const shelf = this.addTracked(this.add.image(w/2, h*0.45, "ui_buff_shelf"));
    fitImage(this, shelf, 1000, 420);

    const positions = [
      [-300,-100],[0,-100],[300,-100],
      [-300,100],[0,100],[300,100]
    ];

    this.buffs.forEach((buff, i) => {
      const [ox, oy] = positions[i];
      const icon = this.addTracked(
        this.add.image(w/2 + ox, h*0.45 + oy, BUFF_ICON_KEYS[buff.id])
          .setInteractive({ useHandCursor: true })
      );

      fitImage(this, icon, 110,110);

      icon.on("pointerdown", () => this.openBuffDetail(buff));
    });

    this.statusText = this.addTracked(
      this.add.text(w/2, h*0.80, "0 / 3 buffs selected", {
        fontSize: "20px",
        color: "#f4e7c1"
      }).setOrigin(0.5)
    );

    const btn = this.addTracked(
      this.add.image(w/2, h*0.90, "button_continue").setInteractive()
    );
    fitImage(this, btn, 260, 70);

    btn.on("pointerdown", () => {
      this.registry.set("selectedBuffs", this.selectedBuffs);
      this.scene.start("BattleScene");
    });
  }

  // ---------- DETAIL PANEL ----------
  openBuffDetail(buff) {
    this.closeBuffDetail();
    this.activeTier = 1;

    const w = this.scale.width;
    const h = this.scale.height;

    const add = o => (this.detailObjects.push(o), o);

    const panel = add(this.add.image(w/2, h/2, "ui_buff_detail_panel"));
    fitImage(this, panel, 520, 700);

    add(this.add.text(w/2, h*0.18, buff.name, {
      fontSize: "28px",
      color: "#f4e7c1"
    }).setOrigin(0.5));

    const icon = add(this.add.image(w/2, h*0.33, BUFF_ICON_KEYS[buff.id]));
    fitImage(this, icon, 130,130);

    add(this.add.text(w/2, h*0.47, buff.description, {
      fontSize: "16px",
      wordWrap: { width: 360 },
      align: "center"
    }).setOrigin(0.5));

    const tierText = add(this.add.text(w/2, h*0.66, "Tier 1 selected", {
      fontSize: "18px",
      color: "#f4e7c1"
    }).setOrigin(0.5));

    [1,2,3].forEach((t,i)=>{
      const btn = add(
        this.add.image(w/2 - 150 + i*150, h*0.57, `detail_panel_button_t${t}`)
          .setInteractive()
      );
      fitImage(this, btn, 130,60);

      btn.on("pointerdown", ()=>{
        this.activeTier = t;
        tierText.setText(`Tier ${t} selected`);
      });
    });

    const exists = this.selectedBuffs.find(b=>b.id===buff.id);
    const key = exists ? "detail_panel_button_update" : "detail_panel_button_select";

    const selectBtn = add(
      this.add.image(w/2 - 110, h*0.82, key).setInteractive()
    );
    fitImage(this, selectBtn, 160,70);

    selectBtn.on("pointerdown", ()=>{
      if (exists) {
        this.selectedBuffs = this.selectedBuffs.filter(b=>b.id!==buff.id);
      } else if (this.selectedBuffs.length < 3) {
        this.selectedBuffs.push({ id: buff.id, tier: this.activeTier });
      }

      this.statusText.setText(`${this.selectedBuffs.length} / 3 buffs selected`);
      this.closeBuffDetail();
    });

    const closeBtn = add(
      this.add.image(w/2 + 110, h*0.82, "detail_panel_button_close").setInteractive()
    );
    fitImage(this, closeBtn, 160,70);

    closeBtn.on("pointerdown", ()=>this.closeBuffDetail());
  }

  closeBuffDetail() {
    this.detailObjects.forEach(o=>o.destroy());
    this.detailObjects = [];
  }
}
