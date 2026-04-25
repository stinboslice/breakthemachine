import Phaser from "phaser";

export class SetupScene extends Phaser.Scene {
  constructor() {
    super("SetupScene");

    this.selectedClass = null;
    this.loadoutContainer = null;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    const dataStore = this.registry.get("dataStore");

    if (!dataStore || !dataStore.data || !dataStore.data.classes) {
      this.add.text(width / 2, height / 2, "DATA STORE NOT FOUND", {
        fontFamily: "Georgia",
        fontSize: "32px",
        color: "#ff4444"
      }).setOrigin(0.5);
      return;
    }

    const classes = dataStore.data.classes;

    this.add.image(width / 2, height / 2, "bg_cutscene_default")
      .setDisplaySize(width, height);

    this.add.text(width / 2, 70, "CHOOSE YOUR ELF", {
      fontFamily: "Georgia",
      fontSize: "42px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    this.loadoutContainer = this.add.container(0, 0);

    classes.forEach((cls, index) => {
      const x = width * 0.25 + index * width * 0.25;
      const y = height * 0.42;
      const spriteKey = `player_${cls.id}_idle`;

      const sprite = this.add.image(x, y, spriteKey)
        .setScale(1.8)
        .setInteractive({ useHandCursor: true });

      sprite.on("pointerdown", () => {
        this.registry.set("selectedClassId", cls.id);
        this.selectedClass = cls.id;
        this.showLoadoutPanel(cls);
      });

      this.add.text(x, y + 150, cls.name, {
        fontFamily: "Georgia",
        fontSize: "26px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5);

      this.add.text(x, y + 190, `HP ${cls.hp}  ATK ${cls.attackMultiplier}  SPD ${cls.speed}`, {
        fontFamily: "Georgia",
        fontSize: "16px",
        color: "#c9b56d",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(0.5);
    });
  }

  showLoadoutPanel(cls) {
    const width = this.scale.width;
    const height = this.scale.height;

    this.loadoutContainer.removeAll(true);

    const panel = this.add.rectangle(width / 2, height * 0.76, 620, 250, 0x050509, 0.9)
      .setStrokeStyle(2, 0xc9b56d);

    const title = this.add.text(width / 2, height * 0.63, "LOADOUT READY", {
      fontFamily: "Georgia",
      fontSize: "28px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5);

    const classText = this.add.text(width / 2, height * 0.69, `Class: ${cls.name}`, {
      fontFamily: "Georgia",
      fontSize: "20px",
      color: "#c9b56d",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5);

    const statText = this.add.text(width / 2, height * 0.73, `HP ${cls.hp}   ATK ${cls.attackMultiplier}   SPD ${cls.speed}`, {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5);

    const startButton = this.add.text(width / 2, height * 0.82, "INITIATE SIMULATION", {
      fontFamily: "Georgia",
      fontSize: "22px",
      color: "#ffffff",
      backgroundColor: "#8b0000",
      padding: { x: 24, y: 12 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.on("pointerdown", () => {
      this.scene.start("BattleScene");
    });

    this.loadoutContainer.add([
      panel,
      title,
      classText,
      statText,
      startButton
    ]);
  }
}
