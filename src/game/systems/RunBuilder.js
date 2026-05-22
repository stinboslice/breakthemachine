import { ensureRunLog, logEvent } from "./EventLogger.js";

export function getBuffTierBurnCost(tier) {
  if (tier === 1) return 1;
  if (tier === 2) return 2;
  return 3;
}

export function getWeaponTierBurnCost(weaponTier) {
  if (weaponTier === "tier1") return 1;
  if (weaponTier === "tier2") return 2;
  if (weaponTier === "tier3") return 3;
  return 0;
}

export function buildRunState({ selectedClass, selectedBuffs, weaponTier = "base", dataStore }) {
  const classes = dataStore?.data?.classes || [];
  const weapons = dataStore?.data?.weapons || [];
  const specials = dataStore?.data?.specials || [];

  const chosenClass =
    classes.find(item => item.id === selectedClass.id) ||
    {
      id: selectedClass.id,
      name: selectedClass.className,
      hp: selectedClass.hp,
      attackMultiplier: selectedClass.attackMultiplier,
      speed: selectedClass.speed,
      passive: ""
    };

  const chosenWeapon = weapons.find(item => item.id === chosenClass.id);
  const chosenSpecial = specials.find(item => item.classId === chosenClass.id);

  let hp = chosenClass.hp;
  let attackMultiplier = chosenClass.attackMultiplier;
  let speed = chosenClass.speed * (chosenWeapon?.speedModifier || 1);
  let crit = chosenClass.id === "rogue" ? 20 : 10;

  selectedBuffs.forEach(buff => {
    const tier = buff.tier || 1;

    if (buff.id === "hp_boost") {
      if (tier === 1) hp += 10;
      if (tier === 2) hp += 15;
      if (tier === 3) hp += 20;
    }

    if (buff.id === "damage_boost") {
      const mult = tier === 1 ? 1.05 : tier === 2 ? 1.075 : 1.10;
      attackMultiplier = Number((attackMultiplier * mult).toFixed(3));
    }

    if (buff.id === "speed_boost") {
      const mult = tier === 1 ? 1.05 : tier === 2 ? 1.075 : 1.10;
      speed = Number((speed * mult).toFixed(3));
    }

    if (buff.id === "crit_boost") {
      if (tier === 1) crit += 5;
      if (tier === 2) crit += 7.5;
      if (tier === 3) crit += 10;
    }
  });

  const blockBuff = selectedBuffs.find(buff => buff.id === "block");
  const doubleStrikeBuff = selectedBuffs.find(buff => buff.id === "double_strike");

  const blockChance = blockBuff
    ? blockBuff.tier === 1
      ? 0.10
      : blockBuff.tier === 2
        ? 0.15
        : 0.20
    : 0;

  const doubleStrikeChance = doubleStrikeBuff
    ? doubleStrikeBuff.tier === 1
      ? 0.075
      : doubleStrikeBuff.tier === 2
        ? 0.11
        : 0.15
    : 0;

  const totalBurn = selectedBuffs.reduce((sum, buff) => {
  return sum + getBuffTierBurnCost(buff.tier || 1);
}, 0);

  const runState = {
    levelIndex: 0,
    waveIndex: 0,
    roundNumber: 1,
    selectedTargetIndex: 0,
    route: {
      level: 1,
      setIndex: 0,
      currentChoices: [],
      scanUsed: false,
      scannedChoiceIndex: null,
      bossDoorReady: false,
      introPlayed: false,
      rewardDamageMult: 1,
      rewardCritFlat: 0,
      rewardFirstHitBlock: false,
      rewardFirstHitBlockUsed: false,
      trapDamageMult: 1,
      trapStacks: 0,
      corruptPenaltyIgnored: chosenClass.id === "berserker"
    },
    player: {
      id: "player",
      name: selectedClass.characterName || "ELF",
      classId: chosenClass.id,
      className: chosenClass.name,
      characterName: selectedClass.characterName || "ELF",
      maxHp: hp,
      hp,
      attackMultiplier,
      speed,
      crit,
      special: chosenSpecial || null,
      specialUsesMax: chosenSpecial ? chosenSpecial.usesPerLevel : 3,
      specialUsesRemaining: chosenSpecial ? chosenSpecial.usesPerLevel : 3,
      passive: chosenClass.passive,
      weaponId: chosenWeapon?.id || chosenClass.id,
      weaponName: chosenWeapon?.name || `${chosenClass.name} Weapon`,
      weaponTier,
      weaponData: chosenWeapon?.tiers?.[weaponTier] || null,
      buffs: selectedBuffs,
      blockChance,
      doubleStrikeChance
    },
    totalBurn,
    currentEnemies: [],
    currentTurnQueue: [],
    currentTurnIndex: 0,
    runEnded: false
    };

ensureRunLog(runState);

logEvent(runState, "run_created", {
  selectedClassId: selectedClass.id,
  selectedClassName: selectedClass.className,
  characterName: selectedClass.characterName,
  selectedBuffs,
  weaponTier,
  totalBurn,
  playerStats: {
    maxHp: runState.player.maxHp,
    attackMultiplier: runState.player.attackMultiplier,
    speed: runState.player.speed,
    crit: runState.player.crit,
    blockChance: runState.player.blockChance,
    doubleStrikeChance: runState.player.doubleStrikeChance
  }
});

return runState;
}
