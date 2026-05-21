import Phaser from "phaser";

import { buildRunState } from "../systems/RunBuilder.js";

import { logEvent } from "../systems/EventLogger.js";

import { playMusic } from "../systems/AudioManager.js";

import {
  connectWallet,
  reconnectWalletSilently,
  getPlayerProfile,
  getWalletSession,
  disconnectWallet,
  buyCreditsWithSol
} from "../systems/WalletManager.js";

const LAUNCH_CLASSES = [
  { id: "vanguard", characterName: "Noah", className: "Vanguard", hp: 130, attackMultiplier: 0.9, speed: 0.8 },
  { id: "berserker", characterName: "Rory", className: "Berserker", hp: 110, attackMultiplier: 1.2, speed: 1.0 },
  { id: "rogue", characterName: "Charlotte", className: "Rogue", hp: 85, attackMultiplier: 1.0, speed: 1.3 }
];

const CLASS_DETAILS = {
  vanguard: {
    difficulty: "Stable",
    passive: "Built to survive longer runs with higher HP and steady pressure.",
    special: "Heavy strike focused on controlled damage and survivability.",
    playstyle: "Best for players who want durability, slower pacing, and safer decisions."
  },
  berserker: {
    difficulty: "Aggressive",
    passive: "Higher damage output with less safety than Vanguard.",
    special: "Power attack designed to punish priority targets.",
    playstyle: "Best for players who want to end fights quickly and accept more risk."
  },
  rogue: {
    difficulty: "Technical",
    passive: "Can scan one hallway outcome per level before choosing a route.",
    special: "Fast burst attack built around speed, crits, and target control.",
    playstyle: "Best for players who want information advantage and precision."
  }
};

const GAME_RULES = [
  "Choose a class, then confirm your class details before selecting buffs.",
  "Choose up to 3 buffs before entering the run. Higher tiers are stronger and will become credit based later.",
  "Each level gives you 2 hallway sets. Each set has 3 hidden choices.",
  "Safe rooms advance the hallway with no fight.",
  "Enemy rooms start combat.",
  "Treasure rooms grant value but still lead into combat.",
  "Corrupt rooms offer power with a penalty.",
  "Trap rooms punish the player before combat.",
  "Rogue can scan one hallway result per level before choosing.",
  "Combat is turn based. Speed affects initiative order.",
  "Special abilities have limited uses per level and reset after level completion.",
  "After each level, extract or continue. Extracting secures the run. Continuing increases risk.",
  "Every major decision and combat action is logged for export."
];

const LAUNCH_BUFFS = [
  { id: "hp_boost", name: "HP Boost", description: "Raises maximum health before entering the run." },
  { id: "damage_boost", name: "Damage Boost", description: "Increases weapon damage dealt during the run." },
  { id: "speed_boost", name: "Speed Boost", description: "Improves initiative and action speed in combat." },
  { id: "crit_boost", name: "Crit Boost", description: "Raises critical strike chance for stronger bursts." },
  { id: "block", name: "Block", description: "Chance to negate incoming attacks." },
  { id: "double_strike", name: "Double Strike", description: "Chance to perform an extra attack." }
];

const CREDIT_PACKAGES = [
  { id: "starter_10", label: "Starter Pack", credits: 10, sol: 0.005, lamports: 5000000 },
  { id: "runner_25", label: "Runner Pack", credits: 25, sol: 0.011, lamports: 11000000 },
  { id: "deep_60", label: "Deep Run Pack", credits: 60, sol: 0.025, lamports: 25000000 }
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
this.weaponTierButtons = [];

this.walletSession = null;
this.playerProfile = null;
this.walletText = null;
this.creditText = null;
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
    playMusic(this, "audio_setup_scene", { volume: 0.45 });
this.restoreWalletSession();
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

async restoreWalletSession() {
  try {
    const session = await reconnectWalletSilently();

    if (!session?.walletAddress) return;

    this.walletSession = session;

    const profile = await getPlayerProfile(session.walletAddress);
    this.playerProfile = profile.profile || null;

    this.showClassScreen();
  } catch (err) {
    console.warn("Wallet restore failed:", err.message);
  }
}

addWalletHud(w, h) {
  const session = getWalletSession();

  const walletLabel = session?.walletMasked
    ? `Wallet: ${session.walletMasked}`
    : "Wallet: Not connected";

  const credits = this.playerProfile?.creditBalance ?? 0;

  this.walletText = this.addTracked(this.add.text(w - 24, 24, walletLabel, {
    fontFamily: "Georgia",
    fontSize: "15px",
    color: "#f4e7c1",
    backgroundColor: "#111111",
    padding: { x: 12, y: 7 },
    stroke: "#000",
    strokeThickness: 3
  }).setOrigin(1, 0));

  this.creditText = this.addTracked(this.add.text(w - 24, 58, `Credits: ${credits}`, {
    fontFamily: "Georgia",
    fontSize: "15px",
    color: "#c9b56d",
    backgroundColor: "#111111",
    padding: { x: 12, y: 7 },
    stroke: "#000",
    strokeThickness: 3
  }).setOrigin(1, 0));

  const connectLabel = session?.walletAddress ? "DISCONNECT" : "CONNECT WALLET";

  const walletButton = this.addTracked(this.add.text(w - 24, 92, connectLabel, {
    fontFamily: "Georgia",
    fontSize: "15px",
    color: "#f4e7c1",
    backgroundColor: session?.walletAddress ? "#333333" : "#7b1113",
    padding: { x: 14, y: 8 },
    stroke: "#000",
    strokeThickness: 3
  }).setOrigin(1, 0).setInteractive({ useHandCursor: true }));

  walletButton.on("pointerdown", async () => {
    try {
      if (getWalletSession()?.walletAddress) {
        disconnectWallet();
        this.walletSession = null;
        this.playerProfile = null;
        this.showClassScreen();
        return;
      }

      walletButton.setText("CONNECTING...");
      const newSession = await connectWallet();
      this.walletSession = newSession;

      const profile = await getPlayerProfile(newSession.walletAddress);
      this.playerProfile = profile.profile || null;

      this.showClassScreen();
       } catch (err) {
      const message = err?.message || "Unknown wallet error";

      walletButton.setText("CONNECT FAILED");

      this.add.text(this.scale.width / 2, this.scale.height * 0.16, message, {
        fontFamily: "Georgia",
        fontSize: "16px",
        color: "#ffb3b3",
        backgroundColor: "#140000",
        padding: { x: 14, y: 8 },
        stroke: "#000",
        strokeThickness: 3,
        wordWrap: { width: Math.min(620, this.scale.width * 0.82) },
        align: "center"
      }).setOrigin(0.5).setDepth(5000);

      console.warn("Wallet connect failed:", message);
    }
    });

  const buyButton = this.addTracked(this.add.text(w - 24, 150, "BUY CREDITS", {
    fontFamily: "Georgia",
    fontSize: "15px",
    color: "#f4e7c1",
    backgroundColor: "#7b1113",
    padding: { x: 14, y: 8 },
    stroke: "#000",
    strokeThickness: 3
  }).setOrigin(1, 0).setInteractive({ useHandCursor: true }));

  buyButton.on("pointerdown", () => {
    if (!getWalletSession()?.walletAddress) {
      buyButton.setText("CONNECT FIRST");
      return;
    }

    this.openCreditShop();
  });
}

openCreditShop() {
  this.closeBuffDetail();

  const w = this.scale.width;
  const h = this.scale.height;
  const add = o => (this.detailObjects.push(o), o);

  add(
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.72)
      .setInteractive()
      .setDepth(4000)
  );

  add(
    this.add.rectangle(w / 2, h / 2, Math.min(720, w * 0.9), Math.min(560, h * 0.78), 0x070707, 0.96)
      .setStrokeStyle(2, 0xc9b56d, 0.9)
      .setDepth(4001)
  );

  add(this.add.text(w / 2, h * 0.20, "CREDIT SHOP", {
    fontFamily: "Georgia",
    fontSize: "32px",
    color: "#f4e7c1",
    stroke: "#000",
    strokeThickness: 5
  }).setOrigin(0.5).setDepth(4002));

  add(this.add.text(w / 2, h * 0.28, "Buy credits to unlock tiers, buffs, and deeper extraction attempts.", {
    fontFamily: "Georgia",
    fontSize: "16px",
    color: "#ffffff",
    align: "center",
    wordWrap: { width: Math.min(560, w * 0.75) }
  }).setOrigin(0.5).setDepth(4002));

  CREDIT_PACKAGES.forEach((pack, index) => {
    const y = h * 0.40 + index * 70;

    const button = add(this.add.text(w / 2, y,
      `${pack.label} | ${pack.credits} Credits | ${pack.sol} SOL`,
      {
        fontFamily: "Georgia",
        fontSize: "19px",
        color: "#f4e7c1",
        backgroundColor: "#111111",
        padding: { x: 24, y: 12 },
        stroke: "#000",
        strokeThickness: 3
      }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(4002));

    button.on("pointerdown", async () => {
      try {
        button.setText("CONFIRM IN PHANTOM...");

        const result = await buyCreditsWithSol({
          packageId: pack.id,
          lamports: pack.lamports
        });

        const profile = result.profile?.profile || null;
        this.playerProfile = profile;

        button.setText(`SUCCESS | ${pack.credits} CREDITS ADDED`);

        this.time.delayedCall(1200, () => {
          this.closeBuffDetail();
          this.showClassScreen();
        });
      }
      
      const message =
  err?.message ||
  err?.error ||
  JSON.stringify(err) ||
  "Payment failed";

button.setText("PAYMENT FAILED");

alert(`Payment failed:\n\n${message}`);

        this.add.text(w / 2, h * 0.70, message, {
          fontFamily: "Georgia",
          fontSize: "15px",
          color: "#ffb3b3",
          backgroundColor: "#140000",
          padding: { x: 14, y: 8 },
          stroke: "#000",
          strokeThickness: 3,
          wordWrap: { width: Math.min(620, w * 0.82) },
          align: "center"
        }).setOrigin(0.5).setDepth(5000);

        console.warn("Credit purchase failed:", message);
      }
    });
  });

  const close = add(this.add.text(w / 2, h * 0.78, "CLOSE", {
    fontFamily: "Georgia",
    fontSize: "20px",
    color: "#f4e7c1",
    backgroundColor: "#333333",
    padding: { x: 26, y: 11 }
  }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(4002));

  close.on("pointerdown", () => this.closeBuffDetail());
}

openRulesPanel() {
  this.closeBuffDetail();

  const w = this.scale.width;
  const h = this.scale.height;
  const add = o => (this.detailObjects.push(o), o);

  const panelX = w / 2;
  const panelY = h / 2;
  const panelW = Math.min(780, w * 0.92);
  const panelH = Math.min(700, h * 0.86);

  const textX = panelX - panelW * 0.39;
  const textStartY = panelY - panelH * 0.28;
  const maskX = panelX - panelW * 0.40;
  const maskY = panelY - panelH * 0.30;
  const maskW = panelW * 0.80;
  const maskH = panelH * 0.50;

  add(
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.78)
      .setInteractive()
      .setDepth(2000)
  );

  const panel = add(
    this.add.rectangle(panelX, panelY, panelW, panelH, 0x070707, 0.96)
      .setStrokeStyle(2, 0xc9b56d, 0.85)
      .setInteractive()
      .setDepth(2001)
  );

  add(this.add.text(w / 2, panelY - panelH * 0.40, "HOW TO PLAY", {
    fontFamily: "Georgia",
    fontSize: "34px",
    color: "#f4e7c1",
    stroke: "#000",
    strokeThickness: 5
  }).setOrigin(0.5).setDepth(2002));

  const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
  maskShape.fillStyle(0xffffff);
  maskShape.fillRect(maskX, maskY, maskW, maskH);

  const textMask = maskShape.createGeometryMask();

  const rulesText = add(this.add.text(
    textX,
    textStartY,
    GAME_RULES.map((line, i) => `${i + 1}. ${line}`).join("\n\n") + "\n\n\n\n\n",
    {
      fontFamily: "Georgia",
      fontSize: "21px",
      color: "#ffffff",
      align: "left",
      wordWrap: { width: maskW },
      lineSpacing: 8
    }
  ).setDepth(2002));

  rulesText.setMask(textMask);

  let scrollY = 0;
  const maxScroll = Math.max(0, rulesText.height - maskH);

  const updateScroll = nextValue => {
    scrollY = Phaser.Math.Clamp(nextValue, 0, maxScroll);
    rulesText.y = textStartY - scrollY;
  };

  this.rulesWheelHandler = (pointer, objects, dx, dy) => {
    updateScroll(scrollY + dy * 0.6);
  };

  this.input.on("wheel", this.rulesWheelHandler);

  let dragging = false;
  let dragStartY = 0;
  let dragStartScroll = 0;

  panel.on("pointerdown", pointer => {
    dragging = true;
    dragStartY = pointer.y;
    dragStartScroll = scrollY;
  });

  panel.on("pointermove", pointer => {
    if (!dragging || !pointer.isDown) return;
    updateScroll(dragStartScroll + (dragStartY - pointer.y));
  });

  panel.on("pointerup", () => {
    dragging = false;
  });

  panel.on("pointerout", () => {
    dragging = false;
  });

  add(this.add.text(w / 2, panelY + panelH * 0.28, "Swipe or scroll to read", {
    fontFamily: "Georgia",
    fontSize: "16px",
    color: "#c9b56d",
    stroke: "#000",
    strokeThickness: 3
  }).setOrigin(0.5).setDepth(2002));

  const close = add(this.add.text(w / 2, panelY + panelH * 0.38, "CLOSE", {
    fontFamily: "Georgia",
    fontSize: "22px",
    color: "#f4e7c1",
    backgroundColor: "#7b1113",
    padding: { x: 34, y: 12 }
  }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2002));

  close.on("pointerdown", () => {
    if (this.rulesWheelHandler) {
      this.input.off("wheel", this.rulesWheelHandler);
      this.rulesWheelHandler = null;
    }

    maskShape.destroy();
    this.closeBuffDetail();
  });
}
openClassConfirmPanel(cls) {
  this.closeBuffDetail();

  const details = CLASS_DETAILS[cls.id];
  const w = this.scale.width;
  const h = this.scale.height;
  const add = o => (this.detailObjects.push(o), o);

  add(
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.72)
      .setInteractive()
      .setDepth(2000)
  );

  add(
    this.add.rectangle(
      w / 2,
      h / 2,
      Math.min(720, w * 0.9),
      Math.min(560, h * 0.78),
      0x070707,
      0.95
    )
      .setStrokeStyle(2, 0xc9b56d, 0.8)
      .setDepth(2001)
  );

  add(this.add.text(w / 2, h * 0.18, `${cls.characterName} | ${cls.className}`, {
    fontFamily: "Georgia",
    fontSize: "30px",
    color: "#f4e7c1",
    stroke: "#000",
    strokeThickness: 5
  }).setOrigin(0.5).setDepth(2002));

  const sprite = add(this.add.image(w / 2, h * 0.35, `player_${cls.id}_idle`).setDepth(2002));
  fitImage(this, sprite, 190, 230);

  add(this.add.text(w / 2, h * 0.53,
    `HP ${cls.hp} | ATK ${cls.attackMultiplier} | SPD ${cls.speed}`,
    {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: "#c9b56d",
      stroke: "#000",
      strokeThickness: 3
    }
  ).setOrigin(0.5).setDepth(2002));

  add(this.add.text(w / 2, h * 0.66,
    `Difficulty: ${details.difficulty}\n\nPassive: ${details.passive}\n\nSpecial: ${details.special}\n\nPlaystyle: ${details.playstyle}`,
    {
      fontFamily: "Georgia",
      fontSize: "16px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: Math.min(600, w * 0.78) },
      lineSpacing: 4
    }
  ).setOrigin(0.5).setDepth(2002));

  const confirm = add(this.add.text(w / 2 - 110, h * 0.84, "CONFIRM", {
    fontFamily: "Georgia",
    fontSize: "20px",
    color: "#f4e7c1",
    backgroundColor: "#7b1113",
    padding: { x: 24, y: 10 }
  }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2002));

  const close = add(this.add.text(w / 2 + 110, h * 0.84, "CLOSE", {
    fontFamily: "Georgia",
    fontSize: "20px",
    color: "#f4e7c1",
    backgroundColor: "#222222",
    padding: { x: 24, y: 10 }
  }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2002));

  confirm.on("pointerdown", () => {
    this.selectedClass = cls;

    window.ELF_PENDING_SETUP_LOG = window.ELF_PENDING_SETUP_LOG || [];
    window.ELF_PENDING_SETUP_LOG.push({
      type: "class_selected",
      payload: {
        classId: cls.id,
        characterName: cls.characterName,
        className: cls.className,
        hp: cls.hp,
        attackMultiplier: cls.attackMultiplier,
        speed: cls.speed
      }
    });

    this.closeBuffDetail();
    this.showBuffScreen();
  });

  close.on("pointerdown", () => this.closeBuffDetail());
}
  // ---------- CLASS SCREEN ----------
  showClassScreen() {
    this.clearTracked();

    const w = this.scale.width;
    const h = this.scale.height;

    this.addTracked(this.add.image(w/2, h/2, "bg_cutscene_default").setDisplaySize(w,h));

    this.addWalletHud(w, h);

this.addTracked(this.add.text(w/2, 50, "CHOOSE YOUR ELF", {
      fontFamily: "Georgia",
      fontSize: "38px",
      color: "#f4e7c1",
      stroke: "#000",
      strokeThickness: 6
    }).setOrigin(0.5));

const rulesButton = this.addTracked(this.add.text(w / 2, 95, "HOW TO PLAY", {
  fontFamily: "Georgia",
  fontSize: "18px",
  color: "#f4e7c1",
  backgroundColor: "#111111",
  padding: { x: 18, y: 8 },
  stroke: "#000",
  strokeThickness: 3
}).setOrigin(0.5).setInteractive({ useHandCursor: true }));

rulesButton.on("pointerdown", () => this.openRulesPanel());

    LAUNCH_CLASSES.forEach((cls, i) => {
      const x = w * 0.25 + i * w * 0.25;
      const y = h * 0.45;

      const panel = this.addTracked(this.add.image(x, y, "ui_class_panel").setInteractive());
      fitImage(this, panel, 280, 400);

      const sprite = this.addTracked(this.add.image(x, y + 18, `player_${cls.id}_idle`).setInteractive());
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
  this.openClassConfirmPanel(cls);
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

const backButton = this.addTracked(this.add.text(24, 24, "BACK", {
  fontFamily: "Georgia",
  fontSize: "18px",
  color: "#f4e7c1",
  backgroundColor: "#111111",
  padding: { x: 16, y: 8 },
  stroke: "#000",
  strokeThickness: 3
}).setOrigin(0, 0).setInteractive({ useHandCursor: true }));

backButton.on("pointerdown", () => {
  this.selectedClass = null;
  this.showClassScreen();
});
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

    icon.on("pointerdown", () => {
  if (this.selectedWeaponTier === "base") {
    this.showTierRequiredPopup();
    return;
  }
 

  this.openBuffDetail(buff);
});
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

this.weaponTierButtons = [];

  const tierLabels = [
    { label: "BASE", value: "base" },
    { label: "TIER 1", value: "tier1" },
    { label: "TIER 2", value: "tier2" },
    { label: "TIER 3", value: "tier3" }
  ];

  tierLabels.forEach((tier, index) => {
  const tierButton = this.addTracked(
    this.add.text(w / 2 - 210 + index * 140, h * 0.805, tier.label, {
      fontFamily: "Georgia",
      fontSize: "16px",
      color: "#ffffff",
      backgroundColor: "#222222",
      padding: { x: 14, y: 8 },
      stroke: "#000",
      strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
  );

  tierButton.tierValue = tier.value;
  tierButton.tierLabel = tier.label;

  this.weaponTierButtons.push(tierButton);

  tierButton.on("pointerdown", () => {
    this.selectedWeaponTier = tier.value;
    this.weaponTierText.setText(`Weapon Tier: ${tier.label}`);

    this.updateWeaponTierButtons();

    window.ELF_PENDING_SETUP_LOG = window.ELF_PENDING_SETUP_LOG || [];
    window.ELF_PENDING_SETUP_LOG.push({
      type: "weapon_tier_selected",
      payload: {
        weaponTier: tier.value,
        label: tier.label
      }
    });
  });
});

this.updateWeaponTierButtons();

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

const pendingLogs = window.ELF_PENDING_SETUP_LOG || [];

pendingLogs.forEach(entry => {
  logEvent(runState, entry.type, entry.payload);
});

logEvent(runState, "setup_completed", {
  selectedClassId: this.selectedClass.id,
  selectedBuffs: this.selectedBuffs,
  weaponTier: this.selectedWeaponTier
});

window.ELF_PENDING_SETUP_LOG = [];
    
    this.registry.set("runState", runState);
    this.registry.set("selectedClassId", this.selectedClass.id);
    this.registry.set("selectedBuffs", this.selectedBuffs);

    this.scene.start("RunIntroScene");
  });
}

updateWeaponTierButtons() {
  if (!this.weaponTierButtons) return;

  this.weaponTierButtons.forEach(button => {
    const isSelected = button.tierValue === this.selectedWeaponTier;

    button.setBackgroundColor(isSelected ? "#7b1113" : "#222222");
    button.setColor(isSelected ? "#f4e7c1" : "#ffffff");

    button.setShadow(
      0,
      0,
      isSelected ? "#f4e7c1" : "#000000",
      isSelected ? 14 : 0,
      true,
      true
    );

    button.setAlpha(isSelected ? 1 : 0.78);
  });
}

showTierRequiredPopup() {
  this.closeBuffDetail();

  const w = this.scale.width;
  const h = this.scale.height;
  const add = o => (this.detailObjects.push(o), o);

  add(
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.72)
      .setInteractive()
      .setDepth(3000)
  );

  add(
    this.add.rectangle(w / 2, h / 2, Math.min(650, w * 0.88), Math.min(360, h * 0.48), 0x070707, 0.96)
      .setStrokeStyle(2, 0xc9b56d, 0.9)
      .setDepth(3001)
  );

  add(this.add.text(w / 2, h * 0.38, "ACCESS DENIED", {
    fontFamily: "Georgia",
    fontSize: "30px",
    color: "#f4e7c1",
    stroke: "#000",
    strokeThickness: 5
  }).setOrigin(0.5).setDepth(3002));

  add(this.add.text(w / 2, h * 0.50,
    "Who do you think you are?\n\nWelcome to the real world, cyber PUNK.\n\nGotta be at least Tier 1 to shop here.",
    {
      fontFamily: "Georgia",
      fontSize: "19px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: Math.min(540, w * 0.76) },
      lineSpacing: 5,
      stroke: "#000",
      strokeThickness: 3
    }
  ).setOrigin(0.5).setDepth(3002));

  const close = add(this.add.text(w / 2, h * 0.66, "CHOOSE A TIER", {
    fontFamily: "Georgia",
    fontSize: "20px",
    color: "#f4e7c1",
    backgroundColor: "#7b1113",
    padding: { x: 26, y: 11 }
  }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(3002));

  close.on("pointerdown", () => this.closeBuffDetail());
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

  add(this.add.text(w / 2, h * 0.1, buff.name, {
    fontSize: "28px",
    color: "#f4e7c1",
    stroke: "#000",
    strokeThickness: 4
  }).setOrigin(0.5).setDepth(1002));

  const icon = add(this.add.image(w / 2, h * 0.295, BUFF_ICON_KEYS[buff.id]).setDepth(1002));
  fitImage(this, icon, 128, 128);

  add(this.add.text(w / 2, h * 0.49, buff.description, {
    fontSize: "16px",
    color: "#ffffff",
    wordWrap: { width: 330 },
    align: "center"
  }).setOrigin(0.5).setDepth(1002));

  const tierText = add(this.add.text(w / 2, h * 0.73, BUFF_TIER_DETAILS[buff.id][1], {
    fontSize: "17px",
    color: "#f4e7c1",
    stroke: "#000",
    strokeThickness: 3,
    wordWrap: { width: 330 },
    align: "center"
  }).setOrigin(0.5).setDepth(1002));

[1, 2, 3].forEach((tier, i) => {

  let x = w / 2 - 145 + i * 145;

  // Move Tier 1 slightly RIGHT
  if (tier === 1) {
    x += 7.5;
  }

  // Move Tier 3 slightly LEFT
  if (tier === 3) {
    x -= 6.5;
  }

  const btn = add(
    this.add.image(x, h * 0.63, `detail_panel_button_t${tier}`)
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
    this.add.image(w / 2 - 105, h * .87, selectKey)
      .setInteractive({ useHandCursor: true })
      .setDepth(1002)
  );

  fitImage(this, selectBtn, 165, 66);

  selectBtn.on("pointerdown", () => {
    const exists = this.selectedBuffs.find(b => b.id === buff.id);

    if (exists) {
  this.selectedBuffs = this.selectedBuffs.filter(b => b.id !== buff.id);

  window.ELF_PENDING_SETUP_LOG = window.ELF_PENDING_SETUP_LOG || [];
  window.ELF_PENDING_SETUP_LOG.push({
    type: "buff_removed",
    payload: {
      buffId: buff.id,
      buffName: buff.name
    }
  });
} else if (this.selectedBuffs.length < 3) {
  this.selectedBuffs.push({ id: buff.id, tier: this.activeTier });

  window.ELF_PENDING_SETUP_LOG = window.ELF_PENDING_SETUP_LOG || [];
  window.ELF_PENDING_SETUP_LOG.push({
    type: "buff_selected",
    payload: {
      buffId: buff.id,
      buffName: buff.name,
      tier: this.activeTier,
      tierDetails: BUFF_TIER_DETAILS[buff.id]?.[this.activeTier] || null
    }
  });
}

    this.statusText.setText(`${this.selectedBuffs.length} / 3 buffs selected`);
    this.closeBuffDetail();
  });

  const closeBtn = add(
    this.add.image(w / 2 + 96, h * .87, "detail_panel_button_close")
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
