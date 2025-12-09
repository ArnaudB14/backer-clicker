export const defaultState = () => ({
  sugar: 0,

  zone: 1,
  monsterIndex: 0,
  monsterHp: 0,
  monsterHpMax: 0,

  tapDamage: 1,

  bakers: [
    { id: "apprentice", level: 0 }, // baker 1
    { id: "golem", level: 0 },      // baker 2
    { id: "witch", level: 0 },      // baker 3
  ],

  lastSave: Date.now(),
});
