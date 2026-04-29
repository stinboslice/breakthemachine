export function resolveRoom(runState, roomType) {
  if (!runState || !runState.player) return runState;

  // SAFE
  if (roomType === "safe") {
    return runState;
  }

  // TREASURE
  if (roomType === "treasure") {
    runState.player.hp = Math.min(
      runState.player.maxHp,
      runState.player.hp + 15
    );
    return runState;
  }

  // CORRUPT
  if (roomType === "corrupt") {
    runState.route.rewardDamageMult =
      (runState.route.rewardDamageMult || 1) * 1.1;

    runState.player.hp -= 10;
    if (runState.player.hp < 0) runState.player.hp = 0;

    return runState;
  }

  // TRAP
  if (roomType === "trap") {
    runState.route.trapStacks = (runState.route.trapStacks || 0) + 1;

    const penalty = Math.floor(runState.player.maxHp * 0.1);
    runState.player.hp -= penalty;

    if (runState.player.hp < 0) runState.player.hp = 0;

    return runState;
  }

  // ENEMY
  if (roomType === "enemy") {
    return runState;
  }

  return runState;
}
