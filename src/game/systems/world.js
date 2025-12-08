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
    id: "apprentice",
    name: "Apprentice Baker",
    baseCost: 15,
    baseDps: 0.6,
    costGrowth: 1.18,
    dpsGrowth: 1.06,
    icon: "baker1",
  },
  {
    id: "golem",
    name: "Oven Golem",
    baseCost: 110,
    baseDps: 6,
    costGrowth: 1.20,
    dpsGrowth: 1.07,
    icon: "baker2",
  },
  {
    id: "witch",
    name: "Frosting Witch",
    baseCost: 900,
    baseDps: 40,
    costGrowth: 1.22,
    dpsGrowth: 1.08,
    icon: "baker3",
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
