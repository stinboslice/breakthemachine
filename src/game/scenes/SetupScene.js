import Phaser from "phaser";

export class SetupScene extends Phaser.Scene {
  constructor() {
    super("SetupScene");
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    const dataStore = this.registry.get("dataStore");
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

    classes.forEach((cls, index) => {
      const x = width * 0.25 + index * width * 0.25;
      const y = height * 0.48;

      const spriteKey = `player_${cls.id}_idle`;

      this.add.image(x, y, spriteKey)
        .setScale(1.8)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          this.registry.set("selectedClassId", cls.id);
          console.log("Selected class:", cls.id);
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
}
