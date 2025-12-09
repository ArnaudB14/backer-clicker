import { BAKERS } from "./systems/world"; // ajuste le chemin

export const defaultState = () => ({
  sugar: 0,

  zone: 1,
  monsterIndex: 0,
  monsterHp: 0,
  monsterHpMax: 0,

  tapDamage: 1,
  baseTapDamage: 1, // optionnel mais utile pour computeTapDamage

  bakers: BAKERS.map(b => ({
    id: b.id,
    level: 0,
  })),

  lastSave: Date.now(),
});
