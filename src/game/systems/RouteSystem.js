export function getHallwayConfig(runState, dataStore) {
  const levelNumber = (runState.levelIndex || 0) + 1;
  const hallways = dataStore?.data?.hallways || [];
  return hallways.find(entry => entry.level === levelNumber) || null;
}

export function getRequiredHallwaySets(runState, dataStore) {
  const config = getHallwayConfig(runState, dataStore);
  return Number(config?.hallwaySets || 2);
}

export function getRoomPool(runState, dataStore) {
  const config = getHallwayConfig(runState, dataStore);

  if (Array.isArray(config?.choicesPool)) {
    return config.choicesPool;
  }

  return ["trap", "corrupt", "treasure", "safe", "enemy"];
}

export function shuffleArray(list) {
  const arr = [...list];

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export function buildHallwayChoices(runState, dataStore) {
  const levelNumber = (runState.levelIndex || 0) + 1;
  const setIndex = runState.route?.setIndex || 0;
  const pool = shuffleArray(getRoomPool(runState, dataStore)).slice(0, 3);

  return pool.map((roomType, index) => ({
    id: `${levelNumber}_${setIndex}_${index}_${roomType}_${Date.now()}`,
    roomType,
    revealed: false
  }));
}

export function getBattleBlockForSet(setIndex) {
  if (setIndex === 0) {
    return { startWaveIndex: 1, endWaveIndex: 2 };
  }

  if (setIndex === 1) {
    return { startWaveIndex: 3, endWaveIndex: 3 };
  }

  return null;
}

export function advanceHallwaySet(runState) {
  if (!runState.route) runState.route = {};

  runState.route.setIndex = (runState.route.setIndex || 0) + 1;
  runState.route.currentRoomType = null;
  runState.route.scannedChoiceIndex = null;
  runState.route.scanUsed = false;
  runState.route.pendingBattleEndWaveIndex = null;

  return runState;
}

export function shouldShowBossDoor(runState, dataStore) {
  return (runState.route?.setIndex || 0) >= getRequiredHallwaySets(runState, dataStore);
}

export function startBattleBlockForCurrentSet(runState) {
  const setIndex = runState.route?.setIndex || 0;
  const block = getBattleBlockForSet(setIndex);

  if (!block) return runState;

  runState.waveIndex = block.startWaveIndex;
  runState.route.pendingBattleEndWaveIndex = block.endWaveIndex;

  return runState;
}

export function finishBattleWave(runState) {
  const currentWaveIndex = runState.waveIndex || 0;
  const endWaveIndex = runState.route?.pendingBattleEndWaveIndex;

  if (typeof endWaveIndex === "number" && currentWaveIndex < endWaveIndex) {
    runState.waveIndex = currentWaveIndex + 1;
    return { runState, nextScene: "BattleScene" };
  }

  runState = advanceHallwaySet(runState);
  return { runState, nextScene: "HallwayScene" };
}

export function getBossEntryWaveIndex(runState, dataStore) {
  const level = dataStore?.data?.levels?.[runState.levelIndex || 0];
  const waves = level?.waves || [];

  const index = waves.findIndex(wave =>
    wave.type === "cutscene" &&
    (
      String(wave.dialogueId || "").includes("miniboss_intro") ||
      String(wave.dialogueId || "").includes("boss_intro")
    )
  );

  return index >= 0 ? index : waves.length - 1;
}
