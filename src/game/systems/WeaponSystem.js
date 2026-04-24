export class WeaponSystem {
  constructor(dataStore) {
    this.dataStore = dataStore;
  }

  getWeaponForClass(classId) {
    return this.dataStore.data.weapons.find(weapon => weapon.id === classId) || null;
  }

  getTierKey(tier) {
    if (!tier || tier <= 0) return "base";
    return `tier${tier}`;
  }

  getWeaponTier(classId, tier) {
    const weapon = this.getWeaponForClass(classId);
    if (!weapon) return null;

    const tierKey = this.getTierKey(tier);
    return weapon.tiers[tierKey] || weapon.tiers.base || null;
  }

  getBurnCost(classId, tier) {
    const weaponTier = this.getWeaponTier(classId, tier);
    return weaponTier?.burnCost || 0;
  }

  rollDamage(classId, tier = 0) {
    const weapon = this.getWeaponForClass(classId);
    const weaponTier = this.getWeaponTier(classId, tier);

    if (!weapon || !weaponTier) {
      return {
        totalDamage: 1,
        hits: [1],
        type: "normal",
        isCrit: false,
        extraStrike: false
      };
    }

    const selectedRoll = this.pickRoll(weaponTier.rolls);
    const hits = selectedRoll.hits || 1;
    const damageHits = [];

    for (let i = 0; i < hits; i += 1) {
      damageHits.push(this.randomInt(selectedRoll.min, selectedRoll.max));
    }

    let extraStrike = false;

    if (selectedRoll.extraStrikeChance) {
      extraStrike = Math.random() <= selectedRoll.extraStrikeChance;

      if (extraStrike) {
        const extraDamage = this.randomInt(selectedRoll.min, selectedRoll.max);
        damageHits.push(extraDamage);
      }
    }

    const totalDamage = damageHits.reduce((sum, value) => sum + value, 0);

    return {
      weaponId: weapon.id,
      weaponName: weapon.name,
      speedModifier: weapon.speedModifier,
      totalDamage,
      hits: damageHits,
      type: selectedRoll.type,
      isCrit: selectedRoll.type === "crit",
      extraStrike
    };
  }

  pickRoll(rolls) {
    const value = Math.random();
    let runningChance = 0;

    for (const roll of rolls) {
      runningChance += roll.chance;

      if (value <= runningChance) {
        return roll;
      }
    }

    return rolls[rolls.length - 1];
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
