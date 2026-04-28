import Phaser from "phaser";

function getPlayerSpriteBase(classId) {
  if (classId === "rogue") return "player_rogue";
  if (classId === "vanguard") return "player_vanguard";
  if (classId === "berserker") return "player_berserker";
  return "player_rogue";
}

export class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    const dataStore = this.registry.get("dataStore");
    const runState = this.registry.get("runState");
const selectedClassId = runState?.player?.classId || this.registry.get("selectedClassId") || "rogue";

const enemy = dataStore?.data?.enemies?.find(e => e.id === "level1_light_enemy");
const player = runState?.player;

    this.add.image(width / 2, height / 2, "bg_depth_1")
      .setDisplaySize(width, height);

    const playerBase = getPlayerSpriteBase(selectedClassId);

    this.player = this.add.image(width * 0.75, height * 0.82, `${playerBase}_idle`);
    this.player.setOrigin(0.5, 1);
    this.player.setScale(2);

    if (enemy) {
      this.enemy = this.add.image(width * 0.28, height * 0.82, `${enemy.spritePrefix}_idle`);
      this.enemy.setOrigin(0.5, 1);
      this.enemy.setScale(1.7);

      this.add.text(width * 0.28, height * 0.18, enemy.name, {
        fontFamily: "Georgia",
        fontSize: "26px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 5
      }).setOrigin(0.5);

      this.add.text(width * 0.28, height * 0.24, `HP ${enemy.hp}`, {
        fontFamily: "Georgia",
        fontSize: "18px",
        color: "#c9b56d",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5);
    }

    this.add.text(width / 2, 48, "LEVEL 1  WAVE 1", {
      fontFamily: "Georgia",
      fontSize: "28px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5);
  }
  if (player) {
  this.add.text(width * 0.75, height * 0.16, `${player.characterName} | ${player.className}`, {
    fontFamily: "Georgia",
    fontSize: "22px",
    color: "#f4e7c1",
    stroke: "#000000",
    strokeThickness: 4
  }).setOrigin(0.5);

  this.add.text(width * 0.75, height * 0.22, `HP ${player.hp}/${player.maxHp}  ATK ${player.attackMultiplier}  SPD ${player.speed}  CRIT ${player.crit}%`, {
    fontFamily: "Georgia",
    fontSize: "16px",
    color: "#c9b56d",
    stroke: "#000000",
    strokeThickness: 3
  }).setOrigin(0.5);
}
}
