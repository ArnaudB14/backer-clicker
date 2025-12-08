// Bases de scaling
const BASE_HP = 12;
const BASE_REWARD = 6;

export function computeMonsterForZone(zone) {
  const hpMax = BASE_HP * Math.pow(1.28, zone - 1);
  const reward = BASE_REWARD * Math.pow(1.22, zone - 1);
  const isBoss = zone % 10 === 0;
  return {
    hpMax: isBoss ? hpMax * 6 : hpMax,
    reward: isBoss ? reward * 4 : reward,
    isBoss,
  };
}

// Bakers config
export const BAKERS = [
  {
    id: "baby",
    name: "Baby Baker",
    baseCost: 15,
    baseDps: 0.6,
    costGrowth: 1.18,
    dpsGrowth: 1.06,
    icon: "baker5",
  },
  {
    id: "apprentice",
    name: "Apprentice Baker",
    baseCost: 110,
    baseDps: 6,
    costGrowth: 1.20,
    dpsGrowth: 1.07,
    icon: "baker1",
  },
  {
    id: "golem",
    name: "Oven Golem",
    baseCost: 900,
    baseDps: 40,
    costGrowth: 1.22,
    dpsGrowth: 1.08,
    icon: "baker2",
  },
  {
    id: "witch",
    name: "Frosting Witch",
    baseCost: 6500,
    baseDps: 220,
    costGrowth: 1.24,
    dpsGrowth: 1.09,
    icon: "baker3",
  },
  {
    id: "macaronia",
    name: "Queen Macaronia",
    baseCost: 42000,
    baseDps: 1200,
    costGrowth: 1.25,
    dpsGrowth: 1.10,
    icon: "baker4",
  },
  {
    id: "muffin",
    name: "Muffin Beaver",
    baseCost: 260000,
    baseDps: 6500,
    costGrowth: 1.26,
    dpsGrowth: 1.11,
    icon: "baker6",
  },
  {
    id: "mice",
    name: "Cooking Mice",
    baseCost: 1600000,
    baseDps: 38000,
    costGrowth: 1.27,
    dpsGrowth: 1.12,
    icon: "baker7",
  },
  {
    id: "dog",
    name: "Cooking Dog",
    baseCost: 9800000,
    baseDps: 210000,
    costGrowth: 1.28,
    dpsGrowth: 1.13,
    icon: "baker8",
  },
];

export function bakerCost(bakerCfg, level) {
  return bakerCfg.baseCost * Math.pow(bakerCfg.costGrowth, level);
}

export function bakerDps(bakerCfg, level) {
  if (level <= 0) return 0;
  // dps = base * level * growth^level (très clicker heroes-like)
  return bakerCfg.baseDps * level * Math.pow(bakerCfg.dpsGrowth, level);
}

export function computeTotalDps(state) {
  return BAKERS.reduce((sum, cfg, i) => {
    const lvl = state.bakers[i]?.level || 0;
    return sum + bakerDps(cfg, lvl);
  }, 0);
}
