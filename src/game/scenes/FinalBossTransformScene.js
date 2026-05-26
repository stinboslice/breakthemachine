import Phaser from "phaser";

export class FinalBossTransformScene extends Phaser.Scene {
  constructor() {
    super("FinalBossTransformScene");
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    const runState = this.registry.get("runState");

    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      1
    );

    const machine = this.add.image(
      width / 2,
      height * 0.52,
      "enemy_level5_boss_idle"
    );

    machine.setScale(1.0);

    const flash = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0xffffff,
      0
    );

    const text = this.add.text(
      width / 2,
      height * 0.18,
      "THE MACHINE EVOLVES",
      {
        fontFamily: "Georgia",
        fontSize: "42px",
        color: "#f4e7c1",
        stroke: "#000000",
        strokeThickness: 6
      }
    ).setOrigin(0.5);

    this.tweens.add({
      targets: machine,
      scale: 1.2,
      duration: 120,
      yoyo: true,
      repeat: 10
    });

    this.tweens.add({
      targets: flash,
      alpha: 0.95,
      duration: 90,
      yoyo: true,
      repeat: 10
    });

    this.time.delayedCall(1800, () => {

      machine.setTexture("enemy_level5_boss_phase2_idle");

      this.tweens.add({
        targets: machine,
        scale: 2.15,
        duration: 900,
        ease: "Sine.easeOut"
      });

      this.cameras.main.shake(1200, 0.012);

      this.time.delayedCall(2200, () => {

        runState.finalBossPhase2Started = true;
        runState.bossTransitionActive = false;

        this.registry.set("runState", runState);

        this.scene.start("BattleScene");
      });
    });
  }
}
