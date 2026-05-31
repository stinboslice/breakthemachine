function ensureRoute(runState) {
  if (!runState.route) runState.route = {};

  if (!Array.isArray(runState.route.activeHallwayEffects)) {
    runState.route.activeHallwayEffects = [];
  }

  if (typeof runState.route.rewardDamageMult !== "number") {
    runState.route.rewardDamageMult = 1;
  }

  if (typeof runState.route.rewardCritFlat !== "number") {
    runState.route.rewardCritFlat = 0;
  }

  if (typeof runState.route.trapDamageMult !== "number") {
    runState.route.trapDamageMult = 1;
  }

  if (typeof runState.route.trapStacks !== "number") {
    runState.route.trapStacks = 0;
  }

  if (typeof runState.route.rewardFirstHitBlock !== "boolean") {
    runState.route.rewardFirstHitBlock = false;
  }

  if (typeof runState.route.rewardFirstHitBlockUsed !== "boolean") {
    runState.route.rewardFirstHitBlockUsed = false;
  }
}

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function addHallwayEffect(runState, effect) {
  ensureRoute(runState);

  runState.route.activeHallwayEffects.push({
    ...effect,
    createdAt: new Date().toISOString()
  });
}

function healPlayer(runState, amount) {
  runState.player.hp = Math.min(
    runState.player.maxHp,
    runState.player.hp + amount
  );
}

function damagePlayer(runState, amount) {
  runState.player.hp -= amount;

  if (runState.player.hp < 0) {
    runState.player.hp = 0;
  }
}

function applyTreasure(runState) {
  const effect = randomChoice([
    {
      id: "treasure_heal_small",
      category: "reward",
      name: "Patch Kit",
      description: "Restored 18 HP immediately.",
      apply: state => {
        healPlayer(state, 18);
      }
    },
    {
      id: "treasure_damage_minor",
      category: "reward",
      name: "War Sigil",
      description: "Outgoing damage increased by 12%.",
      apply: state => {
        state.route.rewardDamageMult = Number(
          ((state.route.rewardDamageMult || 1) * 1.12).toFixed(4)
        );
      }
    },
    {
      id: "treasure_crit_minor",
      category: "reward",
      name: "Deadeye Rune",
      description: "Crit chance increased by 8%.",
      apply: state => {
        state.route.rewardCritFlat = (state.route.rewardCritFlat || 0) + 8;
        state.player.crit = (state.player.crit || 0) + 8;
      }
    },
    {
      id: "treasure_shield_once",
      category: "reward",
      name: "Guard Crest",
      description: "Next incoming hit will be blocked.",
      apply: state => {
        state.route.rewardFirstHitBlock = true;
        state.route.rewardFirstHitBlockUsed = false;
      }
    }
  ]);

  effect.apply(runState);

  addHallwayEffect(runState, {
    id: effect.id,
    category: effect.category,
    name: effect.name,
    description: effect.description
  });
}

function applyCorrupt(runState) {
  const effect = randomChoice([
    {
      id: "corrupt_damage_power",
      category: "corrupt",
      name: "Black Core",
      description: "Outgoing damage increased by 28%. Lost 14 HP immediately.",
      apply: state => {
        state.route.rewardDamageMult = Number(
          ((state.route.rewardDamageMult || 1) * 1.28).toFixed(4)
        );

        damagePlayer(state, 14);
      }
    },
    {
      id: "corrupt_crit_power",
      category: "corrupt",
      name: "Hex Eye",
      description: "Crit chance increased by 18%. Future trap pressure increased.",
      apply: state => {
        state.route.rewardCritFlat = (state.route.rewardCritFlat || 0) + 18;
        state.player.crit = (state.player.crit || 0) + 18;

        state.route.trapDamageMult = Number(
          ((state.route.trapDamageMult || 1) * 1.1).toFixed(4)
        );
      }
    }
  ]);

  effect.apply(runState);

  addHallwayEffect(runState, {
    id: effect.id,
    category: effect.category,
    name: effect.name,
    description: effect.description
  });
}

function applyTrap(runState) {
  const levelNumber = Number(runState.levelIndex || 0) + 1;

  const baseDamageByLevel = {
    1: 8,
    2: 10,
    3: 12,
    4: 14,
    5: 16
  };

  const baseDamage = baseDamageByLevel[levelNumber] || 16;
  const isVanguard = runState.player?.classId === "vanguard";
  const trapDamage = Math.floor(baseDamage * (isVanguard ? 0.65 : 1));

  runState.route.trapStacks = (runState.route.trapStacks || 0) + 1;

  runState.route.trapDamageMult = Number(
    ((runState.route.trapDamageMult || 1) * 1.1).toFixed(4)
  );

  damagePlayer(runState, trapDamage);

  addHallwayEffect(runState, {
    id: "trap_pressure",
    category: "trap",
    name: "Trap Pressure",
    description: `Took ${trapDamage} trap damage. Enemy damage increased by 10%.`
  });
}

export function resolveRoom(runState, roomType) {
  if (!runState || !runState.player) return runState;

  ensureRoute(runState);

  if (roomType === "safe") {
    return runState;
  }

  if (roomType === "treasure") {
    applyTreasure(runState);
    return runState;
  }

  if (roomType === "corrupt") {
    applyCorrupt(runState);
    return runState;
  }

  if (roomType === "trap") {
    applyTrap(runState);
    return runState;
  }

  if (roomType === "enemy") {
    return runState;
  }

  return runState;
}
