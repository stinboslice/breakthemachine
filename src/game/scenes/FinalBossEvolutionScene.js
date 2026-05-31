import Phaser from "phaser";

export class FinalBossEvolutionScene extends Phaser.Scene {
  constructor() {
    super("FinalBossEvolutionScene");
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    const runState = this.registry.get("runState");

    this.cameras.main.setBackgroundColor("#000000");
    this.cameras.main.shake(900, 0.012);

    const title = this.add.text(width / 2, height * 0.14, "THE MACHINE REFUSES DEATH", {
      fontFamily: "Georgia",
      fontSize: "38px",
      color: "#f4e7c1",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(10);

    const boss = this.add.image(width / 2, height * 0.78, "final_boss_hurt");
    boss.setOrigin(0.5, 1);
    boss.setScale(0.72);
    boss.setDepth(5);

    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0);
    flash.setDepth(20);

    const frames = [
      "final_boss_hurt",
      "final_boss_evolve",
      "final_boss_hurt",
      "final_boss_evolve",
      "final_boss_hurt",
      "final_boss_evolve",
      "final_boss_hurt",
      "final_boss_evolve"
    ];

    let index = 0;

    const pulse = () => {
      const key = frames[index] || "final_boss_evolve";

      if (this.textures.exists(key)) {
        boss.setTexture(key);
      }

      boss.setTint(0xffffff);

      this.tweens.add({
        targets: flash,
        alpha: 0.9,
        duration: Math.max(35, 180 - index * 18),
        yoyo: true
      });

      this.tweens.add({
        targets: boss,
        scaleX: 0.72 + index * 0.045,
scaleY: 0.72 + index * 0.045,
        duration: Math.max(45, 170 - index * 16),
        yoyo: true,
        onComplete: () => {
          boss.clearTint();
          index += 1;

          if (index < frames.length) {
            this.time.delayedCall(Math.max(35, 150 - index * 14), pulse);
          } else {
            revealPhaseTwo();
          }
        }
      });
    };

    const revealPhaseTwo = () => {
      title.setText("LIQUIDITY PRESERVATION MODE");

      if (this.textures.exists("final_boss2_idle")) {
        boss.setTexture("final_boss2_idle");
      }

      boss.clearTint();
      boss.setAlpha(1);
      boss.setScale(0.7);

      this.cameras.main.flash(500, 255, 255, 255);
      this.cameras.main.shake(1300, 0.018);

      this.tweens.add({
        targets: boss,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 1100,
        ease: "Sine.easeOut"
      });

      this.time.delayedCall(1800, () => {
        runState.finalBossPhase2Started = true;
        runState.bossTransitionActive = false;
        runState.forceBoss = true;
        runState.bossCleared = false;

        this.registry.set("runState", runState);
        this.scene.start("BattleScene");
      });
    };

    this.time.delayedCall(450, pulse);
  }
}
