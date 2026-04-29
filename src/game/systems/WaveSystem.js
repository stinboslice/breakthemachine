export function getCurrentLevel(runState, dataStore) {
  const levels = dataStore?.data?.levels || [];
  return levels[runState.levelIndex || 0] || levels[0] || null;
}

export function getNextBattleWave(runState, dataStore) {
  const level = getCurrentLevel(runState, dataStore);
  if (!level) return null;

  const waves = level.waves || [];

  for (let i = runState.waveIndex || 0; i < waves.length; i++) {
    if (waves[i].type === "battle") {
      runState.waveIndex = i;
      return waves[i];
    }
  }

  return null;
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

export function advancePastCurrentBattle(runState) {
  runState.waveIndex = (runState.waveIndex || 0) + 1;
  return runState;
}
