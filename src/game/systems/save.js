import { defaultState } from "../state";
import { computeMonsterForZone, computeTotalDps } from "./world";

const KEY = "mbc_save_v0";

export function save(state) {
  state.lastSave = Date.now();
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function load() {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const st = defaultState();
    const m = computeMonsterForZone(st.zone);
    st.monsterHpMax = m.hpMax;
    st.monsterHp = m.hpMax;
    return st;
  }

  try {
    const st = JSON.parse(raw);
    const merged = { ...defaultState(), ...st };
    merged.bakers = defaultState().bakers.map((b, i) => ({
      ...b,
      ...(st.bakers?.[i] || {}),
    }));

    const m = computeMonsterForZone(merged.zone);
    merged.monsterHpMax = m.hpMax;
    merged.monsterHp = Math.min(merged.monsterHp ?? m.hpMax, m.hpMax);

    return merged;
  } catch {
    const st = defaultState();
    const m = computeMonsterForZone(st.zone);
    st.monsterHpMax = m.hpMax;
    st.monsterHp = m.hpMax;
    return st;
  }
}

export function applyOfflineProgress(state) {
  const now = Date.now();
  const elapsedSec = (now - state.lastSave) / 1000;

  if (elapsedSec <= 2) {
    state.lastSave = now;
    return { elapsedSec: 0, gained: 0 };
  }

  const dps = computeTotalDps(state);
  const gained = dps * elapsedSec;

  state.sugar += gained;
  state.lastSave = now;

  return { elapsedSec, gained };
}
