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
      id: "tapmaster",
      name: "Tap Master",
      baseCost: 10,
      baseDps: 0,
      tapBase: 1,
      tapGrowth: 1.10,
      costGrowth: 1.17,
      icon: "tap",
    },
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

export function bakerDps(cfg, lvl) {
  const level = Math.max(0, lvl ?? 0);
  const base = cfg.baseDps ?? 0;
  const growth = cfg.dpsGrowth ?? 1;
  if (level <= 0) return 0;
  return base * Math.pow(growth, level - 1);
}

export function bakerTotalDps(cfg, lvl) {
  const level = Math.max(0, lvl ?? 0);
  if (level <= 0) return 0;

  // si pas de croissance, c'est juste base * lvl
  const base = cfg.baseDps ?? 0;
  const g = cfg.dpsGrowth ?? 1;

  if (g === 1) return base * level;

  // somme géométrique : base * (g^level - 1)/(g - 1)
  return base * (Math.pow(g, level) - 1) / (g - 1);
}


export function computeTotalDps(state) {
  let total = 0;

  for (let i = 0; i < BAKERS.length; i++) {
    const cfg = BAKERS[i];
    const lvl = state.bakers?.[i]?.level ?? 0;

    if (cfg.tapBase) continue; // ignore le baker TAP

    total += bakerTotalDps(cfg, lvl);
  }

  return total;
}



export function bakerTap(cfg, level) {
  if (!cfg.tapBase) return 0;
  // bonus par niveau = tapBase * tapGrowth^(level-1)
  return cfg.tapBase * Math.pow(cfg.tapGrowth ?? 1.0, Math.max(0, level - 1));
}

export function computeTapDamage(state) {
  // dégâts de base au clic (tu peux le garder dans state si tu veux)
  const baseTap = state.baseTapDamage ?? 1;

  let bonusTap = 0;
  for (let i = 0; i < BAKERS.length; i++) {
    const cfg = BAKERS[i];
    const lvl = state.bakers?.[i]?.level ?? 0;
    if (lvl > 0 && cfg.tapBase) {
      // somme des bonus de tap de ce baker
      // (on additionne tap par niveau)
      for (let l = 1; l <= lvl; l++) {
        bonusTap += bakerTap(cfg, l);
      }
    }
  }

  return baseTap + bonusTap;
}
