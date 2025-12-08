import {
  rackLevelCost,
  coolingCost,
  buyRackLevel,
  buyCooling,
} from "../systems/economy";
import { save } from "../systems/save";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.state = this.registry.get("state");
    this.offline = this.registry.get("offline");

    // UI
    this.title = this.add.text(18, 14, "Data Center Idle", {
      fontFamily: "system-ui",
      fontSize: "22px",
      color: "#ffffff",
    });

    this.dataText = this.add.text(18, 60, "", {
      fontFamily: "system-ui",
      fontSize: "18px",
      color: "#cfe8ff",
    });

    this.dpsText = this.add.text(18, 88, "", {
      fontFamily: "system-ui",
      fontSize: "14px",
      color: "#9bb3c9",
    });

    // "Rack" visuel minimal
    const rack = this.add.rectangle(180, 220, 220, 120, 0x111827, 1);
    rack.setStrokeStyle(2, 0x00e5ff, 1);

    this.add.text(120, 205, "RACK CORE", {
      fontFamily: "system-ui",
      fontSize: "14px",
      color: "#00e5ff",
    });

    // Boutons
    this.rackBtn = this.makeButton(18, 340, 324, 56, () => {
      buyRackLevel(this.state);
      this.refreshUI();
    });

    this.coolingBtn = this.makeButton(18, 410, 324, 56, () => {
      buyCooling(this.state);
      this.refreshUI();
    });

    // Offline popup si gains
    if (this.offline?.gained > 0) {
      this.showOfflinePopup(this.offline);
    }

    // Tick idle
    this.lastTick = performance.now();

    // Autosave
    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => save(this.state),
    });

    this.refreshUI();
  }

  update() {
    const now = performance.now();
    const dt = (now - this.lastTick) / 1000;
    this.lastTick = now;

    // production passive
    this.state.data += this.state.dps * dt;

    this.refreshUIThrottled();
  }

  refreshUI() {
    this.dataText.setText(`Data Units: ${Math.floor(this.state.data)}`);
    this.dpsText.setText(`DPS: ${this.state.dps.toFixed(2)}`);

    const rackLvl = this.state.upgrades.rackLevel;
    const rackCost = rackLevelCost(rackLvl);
    this.rackBtn.label.setText(
      `Upgrade Rack (+1 DPS)\nLvl ${rackLvl} • Cost ${rackCost}`
    );
    this.rackBtn.setEnabled(this.state.data >= rackCost);

    const coolLvl = this.state.upgrades.cooling;
    const coolCost = coolingCost(coolLvl);
    this.coolingBtn.label.setText(
      `Cooling (+10% global)\nLvl ${coolLvl} • Cost ${coolCost}`
    );
    this.coolingBtn.setEnabled(this.state.data >= coolCost);
  }

  refreshUIThrottled() {
    if (!this._uiTimer || this._uiTimer < this.time.now) {
      this.refreshUI();
      this._uiTimer = this.time.now + 200; // 5 fois/sec
    }
  }

  makeButton(x, y, w, h, onClick) {
    const bg = this.add.rectangle(x, y, w, h, 0x111827, 0.9).setOrigin(0);
    bg.setStrokeStyle(2, 0x273244, 1);
    bg.setInteractive({ useHandCursor: true });

    const label = this.add.text(x + 12, y + 8, "", {
      fontFamily: "system-ui",
      fontSize: "14px",
      color: "#ffffff",
      lineSpacing: 6,
    });

    bg.on("pointerup", () => onClick());

    bg.setEnabled = (enabled) => {
      bg.alpha = enabled ? 1 : 0.45;
      bg.input.enabled = enabled;
      return bg;
    };

    return { bg, label, setEnabled: bg.setEnabled };
  }

  showOfflinePopup({ elapsedSec, gained }) {
    const w = 300, h = 160;
    const x = (360 - w) / 2;
    const y = 140;

    const panel = this.add.rectangle(x, y, w, h, 0x0f172a, 0.98).setOrigin(0);
    panel.setStrokeStyle(2, 0x7c3aed, 1);

    const txt = this.add.text(x + 14, y + 14,
      `Offline gains\n` +
      `${Math.floor(elapsedSec)}s away\n` +
      `+${Math.floor(gained)} Data Units`,
      {
        fontFamily: "system-ui",
        fontSize: "15px",
        color: "#ffffff",
        lineSpacing: 8,
      }
    );

    const okBtn = this.makeButton(x + 14, y + 96, w - 28, 46, () => {
      panel.destroy();
      txt.destroy();
      okBtn.bg.destroy();
      okBtn.label.destroy();
    });

    okBtn.label.setText("Collect");
    okBtn.setEnabled(true);
  }
}
