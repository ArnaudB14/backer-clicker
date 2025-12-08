import { fmt } from "../systems/format";
import {
  computeMonsterForZone,
  computeTotalDps,
  BAKERS,
  bakerCost,
  bakerDps,
} from "../systems/world";
import { save } from "../systems/save";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.state = this.registry.get("state");
    this.offline = this.registry.get("offline");

    const UI_DEPTH = 10;

    // ----- BACKGROUND (pastel cozy gradient + blobs)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xF6F8FF, 0xF6F8FF, 0xEAF3FF, 0xEAF3FF, 1);
    bg.fillRect(0, 0, 360, 640);

    this.add.circle(40, 70, 90, 0xFFD7E6, 0.22);
    this.add.circle(330, 170, 120, 0xD7FFE9, 0.18);
    this.add.circle(300, 520, 140, 0xFFF0C9, 0.2);

    // Panels (cards) - in background depths
    this.headerPanel = this.panel(12, 10, 336, 96);
    this.monsterPanel = this.panel(12, 118, 336, 250);
    this.upgradePanel = this.panel(12, 382, 336, 246);

    // ----- HEADER UI
    this.add
      .image(30, 34, "sugarIcon")
      .setScale(0.55)
      .setOrigin(0.5)
      .setDepth(UI_DEPTH);

    this.sugarText = this.add
      .text(54, 18, "", {
        fontFamily: "Baloo 2, system-ui",
        fontSize: "24px",
        color: "#1F2A44",
        fontStyle: "700",
      })
      .setDepth(UI_DEPTH);

    this.zoneText = this.add
      .text(54, 54, "", {
        fontFamily: "Baloo 2, system-ui",
        fontSize: "14px",
        color: "#6B7A95",
        fontStyle: "600",
      })
      .setDepth(UI_DEPTH);

    this.dpsText = this.add
      .text(210, 54, "", {
        fontFamily: "Baloo 2, system-ui",
        fontSize: "14px",
        color: "#6B7A95",
        fontStyle: "600",
      })
      .setDepth(UI_DEPTH);

    // ----- MONSTER
    this.monsterShadow = this.add
      .ellipse(180, 310, 150, 28, 0x000000, 0.12)
      .setDepth(UI_DEPTH);

    this.monsterImage = this.add
      .image(180, 230, this.monsterKey())
      .setScale(0.78)
      .setInteractive({ useHandCursor: true })
      .setDepth(UI_DEPTH);

    this.monsterImage.on("pointerdown", () => this.tapMonster());

    // ----- HP BAR (capsule)
    this.hpBarBg = this.roundRect(60, 318, 240, 18, 9, 0xE0E7F5);
    this.hpBarBg.setDepth(UI_DEPTH);

    this.hpBarFill = this.roundRect(60, 318, 240, 18, 9, 0xFF7AAE);
    this.hpBarFill.setDepth(UI_DEPTH);

    this.hpText = this.add
      .text(180, 317, "", {
        fontFamily: "Baloo 2, system-ui",
        fontSize: "12px",
        color: "#1F2A44",
        fontStyle: "600",
      })
      .setOrigin(0.5)
      .setDepth(UI_DEPTH);

    // ----- UPGRADE CARDS (3 bakers)
    this.cards = BAKERS.map((cfg, i) => this.createBakerCard(cfg, i, UI_DEPTH));

    // Offline popup
    if (this.offline?.gained > 0) this.showOfflinePopup(this.offline, UI_DEPTH);

    // Tick
    this.lastTick = performance.now();

    // Autosave
    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => save(this.state),
    });

    this.refreshAll();
  }

  update() {
    const now = performance.now();
    const dt = (now - this.lastTick) / 1000;
    this.lastTick = now;

    // Auto DPS
    const dps = computeTotalDps(this.state);
    if (dps > 0) this.damageMonster(dps * dt);

    this.refreshThrottled();
  }

  // ---------- UI helpers ----------
  panel(x, y, w, h) {
    const shadow = this.add
      .rectangle(x + 2, y + 4, w, h, 0x000000, 0.08)
      .setOrigin(0);
    const r = this.add.rectangle(x, y, w, h, 0xFFFFFF).setOrigin(0);
    r.setStrokeStyle(2, 0xE0E7F5, 1);

    // Panels in background
    shadow.setDepth(1);
    r.setDepth(2);

    return r;
  }

  roundRect(x, y, w, h, radius, color) {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRoundedRect(x, y, w, h, radius);
    return g;
  }

  // ---------- Monster logic ----------
  monsterKey() {
    const isBoss = this.state.zone % 10 === 0;
    if (isBoss) {
      return Math.floor(this.state.zone / 10) % 2 === 0 ? "mb1" : "mb2";
    }
    const idx = (this.state.zone - 1) % 8;
    return ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9"][idx];
  }

  tapMonster() {
    this.damageMonster(this.state.tapDamage);
    this.spawnCrumbs(180, 230);

    // squash feedback
    this.monsterImage.setScale(0.74);
    this.tweens.add({
      targets: this.monsterImage,
      scale: 0.78,
      duration: 90,
      ease: "quad.out",
    });
  }

  damageMonster(amount) {
    this.state.monsterHp -= amount;
    if (this.state.monsterHp <= 0) {
      this.killMonster();
    }
  }

  killMonster() {
    const m = computeMonsterForZone(this.state.zone);
    this.state.sugar += m.reward;

    // next zone
    this.state.zone += 1;
    const next = computeMonsterForZone(this.state.zone);
    this.state.monsterHpMax = next.hpMax;
    this.state.monsterHp = next.hpMax;

    // change sprite
    this.monsterImage.setTexture(this.monsterKey());

    // celebration
    this.spawnCrumbs(180, 230, 12);
  }

  // ---------- Bakers cards ----------
  createBakerCard(cfg, index, UI_DEPTH) {
    const cardY = 400 + index * 76;

    const shadow = this.add
      .rectangle(22 + 2, cardY + 3, 316, 68, 0x000000, 0.06)
      .setOrigin(0)
      .setDepth(UI_DEPTH);

    const card = this.add
      .rectangle(22, cardY, 316, 68, 0xFFFFFF)
      .setOrigin(0)
      .setStrokeStyle(2, 0xE0E7F5, 1)
      .setDepth(UI_DEPTH);

    const icon = this.add
      .image(52, cardY + 34, cfg.icon)
      .setScale(0.60)
      .setDepth(UI_DEPTH);

    const name = this.add
      .text(82, cardY + 6, cfg.name, {
        fontFamily: "Baloo 2, system-ui",
        fontSize: "15px",
        color: "#1F2A44",
        fontStyle: "700",
      })
      .setDepth(UI_DEPTH);

    const info = this.add
      .text(82, cardY + 30, "", {
        fontFamily: "Baloo 2, system-ui",
        fontSize: "12px",
        color: "#6B7A95",
        fontStyle: "600",
      })
      .setDepth(UI_DEPTH);

    const buyShadow = this.add
      .rectangle(250 + 2, cardY + 14, 76, 44, 0x000000, 0.12)
      .setOrigin(0)
      .setDepth(UI_DEPTH);

    const buyBtn = this.add
      .rectangle(250, cardY + 12, 76, 44, 0x4AA3FF)
      .setOrigin(0)
      .setStrokeStyle(2, 0x2E86E8)
      .setInteractive({ useHandCursor: true })
      .setDepth(UI_DEPTH);

    const buyText = this.add
      .text(288, cardY + 22, "BUY", {
        fontFamily: "Baloo 2, system-ui",
        fontSize: "13px",
        color: "#FFFFFF",
        fontStyle: "700",
      })
      .setOrigin(0.5)
      .setDepth(UI_DEPTH);

    buyBtn.on("pointerdown", () => {
      this.buyBaker(index);
      buyBtn.scale = 0.97;
      buyShadow.scale = 0.97;
    });
    buyBtn.on("pointerup", () => {
      buyBtn.scale = 1;
      buyShadow.scale = 1;
    });
    buyBtn.on("pointerout", () => {
      buyBtn.scale = 1;
      buyShadow.scale = 1;
    });

    return {
      cfg,
      index,
      card,
      icon,
      name,
      info,
      buyBtn,
      buyText,
      shadow,
      buyShadow,
    };
  }

  buyBaker(i) {
    const cfg = BAKERS[i];
    const lvl = this.state.bakers[i].level;
    const cost = bakerCost(cfg, lvl);

    if (this.state.sugar < cost) return;

    this.state.sugar -= cost;
    this.state.bakers[i].level += 1;
    this.spawnCrumbs(288, 400 + i * 76 + 34, 6);
    this.refreshAll();
  }

  // ---------- Particles ----------
  spawnCrumbs(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
      const c = this.add
        .image(
          x + Phaser.Math.Between(-18, 18),
          y + Phaser.Math.Between(-10, 10),
          "crumb"
        )
        .setScale(Phaser.Math.FloatBetween(0.6, 0.9))
        .setDepth(20);

      this.tweens.add({
        targets: c,
        y: y - Phaser.Math.Between(24, 56),
        x: x + Phaser.Math.Between(-24, 24),
        alpha: 0,
        duration: Phaser.Math.Between(500, 850),
        ease: "sine.out",
        onComplete: () => c.destroy(),
      });
    }
  }

  // ---------- Refresh ----------
  refreshAll() {
    this.sugarText.setText(`${fmt(this.state.sugar)} Sugar`);

    const dps = computeTotalDps(this.state);
    const bossTag = computeMonsterForZone(this.state.zone).isBoss ? " • BOSS" : "";
    this.zoneText.setText(`Zone ${this.state.zone}${bossTag}`);
    this.dpsText.setText(`DPS ${fmt(dps)}  •  Tap ${fmt(this.state.tapDamage)}`);

    const ratio = Phaser.Math.Clamp(
      this.state.monsterHp / this.state.monsterHpMax,
      0,
      1
    );

    // HP fill width update via graphics: clear & redraw
    this.hpBarFill.clear();
    this.hpBarFill.fillStyle(
      computeMonsterForZone(this.state.zone).isBoss ? 0xFFB454 : 0xFF7AAE,
      1
    );
    this.hpBarFill.fillRoundedRect(60, 318, 240 * ratio, 18, 9);

    this.hpText.setText(
      `${fmt(this.state.monsterHp)} / ${fmt(this.state.monsterHpMax)}`
    );

    // Cards
    this.cards.forEach((c) => {
      const lvl = this.state.bakers[c.index].level;
      const cost = bakerCost(c.cfg, lvl);
      const dpsOne = bakerDps(c.cfg, lvl);

      c.info.setText(`Lvl ${lvl} • DPS ${fmt(dpsOne)} • Cost ${fmt(cost)}`);

      const affordable = this.state.sugar >= cost;
      c.buyBtn.fillColor = affordable ? 0x4AA3FF : 0x9BB3C9;
      c.buyText.setText(affordable ? "BUY" : "LOCK");
    });
  }

  refreshThrottled() {
    if (!this._uiTimer || this._uiTimer < this.time.now) {
      this.refreshAll();
      this._uiTimer = this.time.now + 150;
    }
  }

  // ---------- Offline popup ----------
  showOfflinePopup({ elapsedSec, gained }, UI_DEPTH) {
    const w = 300, h = 160;
    const x = (360 - w) / 2;
    const y = 160;

    const shadow = this.add.rectangle(x + 2, y + 4, w, h, 0x000000, 0.1).setOrigin(0).setDepth(UI_DEPTH + 5);
    const panel = this.add.rectangle(x, y, w, h, 0xffffff, 1).setOrigin(0).setDepth(UI_DEPTH + 5);
    panel.setStrokeStyle(2, 0xe0e7f5, 1);

    const txt = this.add.text(
      x + 14,
      y + 14,
      `Offline gains\n${Math.floor(elapsedSec)}s away\n+${fmt(gained)} Sugar`,
      {
        fontFamily: "Baloo 2, system-ui",
        fontSize: "15px",
        color: "#1F2A44",
        lineSpacing: 8,
        fontStyle: "700",
      }
    ).setDepth(UI_DEPTH + 6);

    const btnShadow = this.add.rectangle(x + 16, y + 102, w - 28, 46, 0x000000, 0.12).setOrigin(0).setDepth(UI_DEPTH + 5);
    const btn = this.add.rectangle(x + 14, y + 100, w - 28, 46, 0x58d68d)
      .setOrigin(0)
      .setStrokeStyle(2, 0x3bbf74)
      .setInteractive({ useHandCursor: true })
      .setDepth(UI_DEPTH + 6);

    const btntxt = this.add.text(x + w / 2, y + 112, "COLLECT", {
      fontFamily: "Baloo 2, system-ui",
      fontSize: "14px",
      color: "#FFFFFF",
      fontStyle: "700",
    }).setOrigin(0.5).setDepth(UI_DEPTH + 7);

    btn.on("pointerup", () => {
      shadow.destroy();
      panel.destroy();
      txt.destroy();
      btn.destroy();
      btntxt.destroy();
      btnShadow.destroy();
    });
  }
}
