import { defaultState } from "../state";
import { applyRackLevel } from "./economy";

const KEY = "dci_save_v0";

export function save(state) {
  state.lastSave = Date.now();
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function load() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return defaultState();

  try {
    const st = JSON.parse(raw);
    // garde compat si on change le state plus tard
    const merged = { ...defaultState(), ...st };
    merged.upgrades = { ...defaultState().upgrades, ...st.upgrades };
    applyRackLevel(merged);
    return merged;
  } catch {
    return defaultState();
  }
}

export function applyOfflineProgress(state) {
  const now = Date.now();
  const elapsedSec = (now - state.lastSave) / 1000;
  if (elapsedSec <= 1) return { elapsedSec: 0, gained: 0 };

  const gained = state.dps * elapsedSec;
  state.data += gained;
  state.lastSave = now;

  return { elapsedSec, gained };
}
