export class EnemySystem {
  constructor(dataStore) {
    this.dataStore = dataStore;
  }

  getEnemiesForLevel(levelNumber) {
    return this.dataStore.data.enemies.filter(enemy => enemy.level === levelNumber);
  }

  getEnemyById(enemyId) {
    return this.dataStore.data.enemies.find(enemy => enemy.id === enemyId) || null;
  }

  createEnemy(enemyId, uid = null) {
    const base = this.getEnemyById(enemyId);
    if (!base) {
      throw new Error(`Enemy not found: ${enemyId}`);
    }

    return {
      ...structuredClone(base),
      uid: uid || `${base.id}_${crypto.randomUUID()}`,
      currentHp: base.hp,
      alive: true
    };
  }

  createEnemiesByRole(levelNumber, role, count = 1) {
    const pool = this.getEnemiesForLevel(levelNumber)
      .filter(enemy => enemy.role === role);

    if (!pool.length) {
      throw new Error(`No enemies found for level ${levelNumber} and role ${role}`);
    }

    const enemies = [];

    for (let i = 0; i < count; i++) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      enemies.push(this.createEnemy(pick.id, `${pick.id}_${Date.now()}_${i}`));
    }

    return enemies;
  }

  createBattleFromRoom(levelNumber, roomType) {
    if (roomType === "enemy") {
      return this.createEnemiesByRole(levelNumber, "light", 2);
    }

    if (roomType === "strong") {
      return this.createEnemiesByRole(levelNumber, "strong", 1);
    }

    if (roomType === "miniboss") {
      return this.getEnemiesForLevel(levelNumber)
        .filter(enemy => enemy.role === "miniboss")
        .map((enemy, index) => this.createEnemy(enemy.id, `${enemy.id}_${Date.now()}_${index}`));
    }

    if (roomType === "boss") {
      return [this.createEnemy("level5_boss_phase1", `level5_boss_phase1_${Date.now()}`)];
    }

    return [];
  }

  rollEnemyDamage(enemy) {
    const min = enemy.damageMin || 1;
    const max = enemy.damageMax || min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  damageEnemy(enemy, amount) {
    enemy.currentHp = Math.max(0, enemy.currentHp - amount);
    enemy.alive = enemy.currentHp > 0;
    return enemy.currentHp;
  }

  isPartyDefeated(enemies) {
    return enemies.every(enemy => !enemy.alive || enemy.currentHp <= 0);
  }
}
