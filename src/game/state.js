export const defaultState = () => ({
  data: 0,          // Data Units
  dps: 1,           // Data per second
  upgrades: {
    rackLevel: 0,   // +1 dps per level
    cooling: 0,     // +10% global per level
  },
  lastSave: Date.now(),
});
