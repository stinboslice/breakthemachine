export function getCurrentLevel(runState, dataStore) {
  const levels = dataStore?.data?.levels || [];
  return levels[runState.levelIndex || 0] || levels[0] || null;
}

export function getWaveAtCurrentIndex(runState, dataStore) {
  const level = getCurrentLevel(runState, dataStore);
  if (!level) return null;

  const waves = level.waves || [];
  return waves[runState.waveIndex || 0] || null;
}

export function getBossBattleWave(runState, dataStore) {
  const level = getCurrentLevel(runState, dataStore);
  if (!level) return null;

  const waves = level.waves || [];

  const bossIndex = waves.findIndex(wave => {
    if (wave.type !== "battle") return false;

    return wave.enemies?.some(enemyId =>
      String(enemyId).includes("miniboss") ||
      String(enemyId).includes("boss")
    );
  });

  if (bossIndex < 0) return null;

  runState.waveIndex = bossIndex;
  return waves[bossIndex];
}

export function buildEnemiesForWave(wave, dataStore) {
  const enemies = dataStore?.data?.enemies || [];

  return (wave?.enemies || [])
    .map((enemyId, index) => {
      const enemy = enemies.find(item => item.id === enemyId);
      if (!enemy) return null;

      return {
        ...enemy,
        uid: `${enemyId}_${index}_${Date.now()}`,
        currentHp: enemy.hp,
        turnCounter: 0
      };
    })
    .filter(Boolean);
}
