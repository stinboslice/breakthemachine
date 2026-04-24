export class LevelSystem {
  constructor(dataStore, enemySystem) {
    this.dataStore = dataStore;
    this.enemySystem = enemySystem;
  }

  getLevel(levelNumber) {
    return this.dataStore.data.levels.find(l => l.level === levelNumber) || null;
  }

  getCurrentLevel() {
    return this.getLevel(this.getCurrentLevelNumber());
  }

  getCurrentLevelNumber() {
    return (this.dataStore.currentLevelIndex || 0) + 1;
  }

  getCurrentWave() {
    const level = this.getCurrentLevel();
    if (!level) return null;

    return level.waves[this.dataStore.currentWaveIndex] || null;
  }

  advanceWave() {
    this.dataStore.currentWaveIndex += 1;
  }

  resetWaves() {
    this.dataStore.currentWaveIndex = 0;
  }

  advanceLevel() {
    this.dataStore.currentLevelIndex += 1;
    this.resetWaves();
  }

  isLevelComplete() {
    const level = this.getCurrentLevel();
    if (!level) return true;

    return this.dataStore.currentWaveIndex >= level.waves.length;
  }

  createBattleFromWave(wave) {
    if (!wave || wave.type !== "battle") return [];

    return wave.enemies.map((enemyId, index) =>
      this.enemySystem.createEnemy(enemyId, `${enemyId}_${Date.now()}_${index}`)
    );
  }

  getWaveType() {
    const wave = this.getCurrentWave();
    return wave?.type || null;
  }

  getWaveDialogueId() {
    const wave = this.getCurrentWave();
    if (wave?.type !== "cutscene") return null;
    return wave.dialogueId;
  }

  getRewardMultiplier() {
    const level = this.getCurrentLevel();
    return level?.rewardMultiplier || 1;
  }
}
