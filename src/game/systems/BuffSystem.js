export class BuffSystem {
  constructor(dataStore) {
    this.dataStore = dataStore;
  }

  getBuffById(buffId) {
    return this.dataStore.data.buffs.find(buff => buff.id === buffId) || null;
  }

  getSelectedBuffs() {
    return this.dataStore.setup.selectedBuffs
      .map(buffId => this.getBuffById(buffId))
      .filter(Boolean);
  }

  hasBuff(buffId) {
    return this.dataStore.setup.selectedBuffs.includes(buffId);
  }

  getBuffTier(buffId) {
    if (this.dataStore.setup.activeBuffId !== buffId) return 1;
    return this.dataStore.setup.activeBuffTier || 1;
  }

  getStatModifiers() {
    return {
      maxHpBonus: this.hasBuff("hp_boost") ? 20 * this.getBuffTier("hp_boost") : 0,
      damageMultiplier: this.hasBuff("damage_boost") ? 1 + 0.15 * this.getBuffTier("damage_boost") : 1,
      speedMultiplier: this.hasBuff("speed_boost") ? 1 + 0.12 * this.getBuffTier("speed_boost") : 1,
      critBonus: this.hasBuff("crit_boost") ? 0.08 * this.getBuffTier("crit_boost") : 0,
      blockChance: this.hasBuff("block") ? 0.10 * this.getBuffTier("block") : 0,
      doubleStrikeChance: this.hasBuff("double_strike") ? 0.10 * this.getBuffTier("double_strike") : 0
    };
  }

  shouldBlock() {
    const modifiers = this.getStatModifiers();
    return Math.random() <= modifiers.blockChance;
  }

  shouldDoubleStrike() {
    const modifiers = this.getStatModifiers();
    return Math.random() <= modifiers.doubleStrikeChance;
  }
}
