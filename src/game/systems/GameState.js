export const GameState = {
  data: {
    classes: [],
    weapons: [],
    buffs: [],
    enemies: [],
    levels: [],
    dialogue: [],
    specials: [],
    hallways: [],
    roomRewards: null
  },

  player: null,

  setup: {
    selectedBuffs: [],
    activeBuffId: null,
    activeBuffTier: 1
  },

  route: {
    active: false,
    level: 1,
    setIndex: 0,
    currentChoices: [],
    currentRoomType: null,
    scanUsed: false,
    scannedChoiceIndex: null,
    bossDoorReady: false,
    introPlayed: false,
    pendingBattleEndWaveIndex: null,
    rewardDamageMult: 1,
    rewardCritFlat: 0,
    rewardFirstHitBlock: false,
    rewardFirstHitBlockUsed: false,
    trapDamageMult: 1,
    trapStacks: 0,
    corruptPenaltyIgnored: false
  },

  currentLevelIndex: 0,
  currentWaveIndex: 0,
  currentEnemies: [],
  selectedTargetIndex: 0,
  currentTurnQueue: [],
  currentTurnIndex: 0,
  roundNumber: 1,
  runRewardMultiplier: 0,
  runEnded: false,

  cutscene: {
    active: false,
    lines: [],
    speaker: "",
    portrait: "",
    portraitMood: "neutral",
    battlefieldState: "idle",
    index: 0,
    onComplete: null
  }
};

export const EventLog = [];

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function loadJSON(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  return response.json();
}

export function getCurrentLevelNumber() {
  return GameState.currentLevelIndex + 1;
}

export function getHallwayConfigForLevel(levelNumber) {
  return GameState.data.hallways.find(entry => entry.level === levelNumber) || null;
}

export function shuffleArray(list) {
  const array = [...list];

  for (let i = array.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
  }

  return array;
}

export function resetLevelRouteState(levelNumber) {
  GameState.route.active = false;
  GameState.route.level = levelNumber;
  GameState.route.setIndex = 0;
  GameState.route.currentChoices = [];
  GameState.route.currentRoomType = null;
  GameState.route.scanUsed = false;
  GameState.route.scannedChoiceIndex = null;
  GameState.route.bossDoorReady = false;
  GameState.route.introPlayed = false;
  GameState.route.pendingBattleEndWaveIndex = null;
}

export function resetRunRouteModifiers() {
  GameState.route.rewardDamageMult = 1;
  GameState.route.rewardCritFlat = 0;
  GameState.route.rewardFirstHitBlock = false;
  GameState.route.rewardFirstHitBlockUsed = false;
  GameState.route.trapDamageMult = 1;
  GameState.route.trapStacks = 0;
  GameState.route.corruptPenaltyIgnored = GameState.player?.classId === "berserker";
}

export function getDialogueById(id) {
  return GameState.data.dialogue.find(entry => entry.id === id) || null;
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}
