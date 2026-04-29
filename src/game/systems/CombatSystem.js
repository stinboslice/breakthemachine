export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rollWeaponDamage(player) {
  const rolls = player?.weaponData?.rolls;

  if (!Array.isArray(rolls) || !rolls.length) {
    return randomInt(4, 8);
  }

  const rand = Math.random();
  let cumulative = 0;

  for (const roll of rolls) {
    cumulative += roll.chance;

    if (rand <= cumulative) {
      if (roll.type === "multi") {
        let total = 0;

        for (let i = 0; i < roll.hits; i++) {
          total += randomInt(roll.min, roll.max);
        }

        if (roll.extraStrikeChance && Math.random() <= roll.extraStrikeChance) {
          let extra = randomInt(roll.min, roll.max);

          if (roll.extraStrikeCritChance && Math.random() <= roll.extraStrikeCritChance) {
            extra = Math.floor(extra * 1.5);
          }

          total += extra;
        }

        return total;
      }

      let damage = randomInt(roll.min, roll.max);

      if (roll.type === "crit") {
        damage = Math.floor(damage * 1.5);
      }

      return damage;
    }
  }

  return randomInt(4, 8);
}

export function playerAttack(runState, enemy) {
  const player = runState.player;

  let rawDamage = rollWeaponDamage(player);

  if (player.classId === "berserker" && player.hp < player.maxHp * 0.5) {
    rawDamage = Math.floor(rawDamage * 1.1);
  }

  const finalDamage = Math.floor(
    rawDamage *
    player.attackMultiplier *
    (runState.route.rewardDamageMult || 1)
  );

  enemy.currentHp -= finalDamage;
  if (enemy.currentHp < 0) enemy.currentHp = 0;

  return {
    damage: finalDamage,
    enemyDefeated: enemy.currentHp <= 0
  };
}

export function enemyAttack(runState, enemy) {
  const player = runState.player;

  let damage = randomInt(enemy.damageMin, enemy.damageMax);

  if (enemy.abilities?.includes("overload") && Math.random() <= 0.15) {
    damage = enemy.damageMax + 2;
  }

  if (enemy.abilities?.includes("heavy_strike") && Math.random() <= 0.2) {
    damage = Math.floor(damage * 1.5);
  }

  if (runState.route.rewardFirstHitBlock && !runState.route.rewardFirstHitBlockUsed) {
    runState.route.rewardFirstHitBlockUsed = true;
    damage = 0;
  } else if (player.blockChance > 0 && Math.random() <= player.blockChance) {
    damage = 0;
  }

  player.hp -= damage;
  if (player.hp < 0) player.hp = 0;

  return {
    damage,
    playerDefeated: player.hp <= 0
  };
}
