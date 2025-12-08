export function rackLevelCost(level) {
  return Math.floor(10 * Math.pow(1.15, level));
}

export function coolingCost(level) {
  return Math.floor(50 * Math.pow(1.22, level));
}

export function applyRackLevel(state) {
  const lvl = state.upgrades.rackLevel;
  // base dps = 1 + lvl
  const base = 1 + lvl;
  const coolingMult = 1 + state.upgrades.cooling * 0.10;
  state.dps = base * coolingMult;
}

export function buyRackLevel(state) {
  const cost = rackLevelCost(state.upgrades.rackLevel);
  if (state.data < cost) return false;

  state.data -= cost;
  state.upgrades.rackLevel += 1;
  applyRackLevel(state);
  return true;
}

export function buyCooling(state) {
  const cost = coolingCost(state.upgrades.cooling);
  if (state.data < cost) return false;

  state.data -= cost;
  state.upgrades.cooling += 1;
  applyRackLevel(state);
  return true;
}
