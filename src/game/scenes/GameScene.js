import { fmt } from "../systems/format";
import {
  computeMonsterForZone,
  computeTotalDps,
  computeTapDamage,
  BAKERS,
  bakerCost,
  bakerDps,
  bakerTotalDps,
  bakerTap,
} from "../systems/world";
import { save } from "../systems/save";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    const canvas = this.game.canvas;

// iOS/Safari: empêche le navigateur d'intercepter les swipes
canvas.addEventListener(
  "touchmove",
  (e) => e.preventDefault(),
  { passive: false }
);
canvas.addEventListener(
  "touchstart",
  (e) => e.preventDefault(),
  { passive: false }
);

    this.state = this.registry.get("state");
    this.offline = this.registry.get("offline");
this.cameras.main.roundPixels = true;

    // ---- MIGRATION SAVE : aligner state.bakers sur BAKERS
    if (!this.state.bakers || !Array.isArray(this.state.bakers)) {
      this.state.bakers = [];
    }
    for (let i = 0; i < BAKERS.length; i++) {
      if (!this.state.bakers[i]) {
        this.state.bakers[i] = { level: 0 };
      }
    }

    const { width, height } = this.scale;
    const UI_DEPTH = 10;

    // ----- BACKGROUND (PNG storybook)
    this.bg = this.add
      .image(width / 2, height / 2, "bg1")
      .setOrigin(0.5)
      .setDepth(-100);

    const bgScaleX = width / this.bg.width;
    const bgScaleY = height / this.bg.height;
    const bgScale = Math.max(bgScaleX, bgScaleY);
    this.bg.setScale(bgScale);
    this.bg.setScrollFactor(0);

    // Panels (header only)
    this.headerPanel = this.panel(12, 10, 336, 52);

    // ----- HEADER UI
    this.sugarIcon = this.add
      .image(30, 34, "sugarIcon")
      .setOrigin(0.5)
      .setDepth(UI_DEPTH);
    this.scaleToWidth(this.sugarIcon, 22);

    this.sugarText = this.add
      .text(54, 18, "", {
        fontFamily: "Baloo 2, system-ui",
        fontSize: "24px",
        color: "#1F2A44",
        fontStyle: "700",
      })
      .setDepth(UI_DEPTH);

    this.zoneText = this.add
      .text(54, 40, "", {
        fontFamily: "Baloo 2, system-ui",
        fontSize: "14px",
        color: "#6B7A95",
        fontStyle: "600",
      })
      .setDepth(UI_DEPTH);

    this.dpsText = this.add
      .text(210, 40, "", {
        fontFamily: "Baloo 2, system-ui",
        fontSize: "14px",
        color: "#6B7A95",
        fontStyle: "600",
      })
      .setDepth(UI_DEPTH);

    // ----- MONSTER
    this.monsterShadow = this.add
      .ellipse(width / 2, 310, 150, 28, 0x000000, 0.12)
      .setDepth(UI_DEPTH);

    this.monsterImage = this.add
      .image(width / 2, 230, this.monsterKey())
      .setInteractive({ useHandCursor: true })
      .setDepth(UI_DEPTH);

    this.scaleToWidth(this.monsterImage, width * 0.5);
    this.monsterBaseScale = this.monsterImage.scaleX;
    this.monsterImage.on("pointerdown", () => this.tapMonster());

    // ----- HP BAR (capsule)
    this.hpBarBg = this.roundRect(60, 318, 240, 18, 9, 0xE0E7F5);
    this.hpBarBg.setDepth(UI_DEPTH);

    this.hpBarFill = this.roundRect(60, 318, 240, 18, 9, 0xFFB454);
    this.hpBarFill.setDepth(UI_DEPTH);

    this.hpText = this.add
      .text(width / 2, 327, "", {
        fontFamily: "Baloo 2, system-ui",
        fontSize: "14px",
        color: "#1F2A44",
        fontStyle: "600",
      })
      .setOrigin(0.5)
      .setDepth(UI_DEPTH);

    // ----- SCROLLABLE BAKERS LIST
    this.listX = 12;
    this.listY = 382;
    this.listW = 336;
    this.listH = height - this.listY - 12;

    this.cardGap = 8;
    this.cardH = 76;
    this.cardInnerH = 68;

    this.createScrollableBakerList(UI_DEPTH);

    // Offline popup
    if (this.offline?.gained > 0) {
      this.showOfflinePopup(this.offline, UI_DEPTH);
    }

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

    const dps = computeTotalDps(this.state) || 0;
    if (dps > 0) this.damageMonster(dps * dt);

    this.refreshThrottled();
  }

  // ---------- UI helpers ----------
  panel(x, y, w, h) {
    const shadow = this.add
      .rectangle(x + 2, y + 4, w, h, 0x000000, 0.08)
      .setOrigin(0);
    const r = this.add.rectangle(x, y, w, h, 0xffffff).setOrigin(0);
    r.setStrokeStyle(2, 0xe0e7f5, 1);

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

  scaleToWidth(sprite, targetWidth) {
    const s = targetWidth / sprite.width;
    sprite.setScale(s);
    return sprite;
  }

  scaleToFit(sprite, maxW, maxH) {
    const s = Math.min(maxW / sprite.width, maxH / sprite.height);
    sprite.setScale(s);
    return sprite;
  }

  // ---------- Scrollable list ----------
  createScrollableBakerList(UI_DEPTH) {
    this.bakerList = this.add.container(0, 0).setDepth(UI_DEPTH);
    this.cards = [];

    BAKERS.forEach((cfg, i) => {
      const localY = this.cardGap + i * this.cardH;
      const cardObj = this.createBakerCard(cfg, i, localY);
      this.bakerList.add(cardObj.root);
      this.cards.push(cardObj);
    });

    this.listContentH = this.cardGap + BAKERS.length * this.cardH;
    this.scrollY = 0;

    const maskGfx = this.make.graphics();
    maskGfx.fillStyle(0xffffff);
    maskGfx.fillRect(this.listX, this.listY, this.listW, this.listH);
    const mask = maskGfx.createGeometryMask();
    this.bakerList.setMask(mask);

    this.bakerList.x = this.listX;
    this.bakerList.y = this.listY;

    this.input.on("wheel", (_p, _g, _dx, dy) => {
      this.setScroll(this.scrollY - dy * 0.5);
    });

    this.enableListDrag();
  }

enableListDrag() {
  this.listRect = new Phaser.Geom.Rectangle(
    this.listX,
    this.listY,
    this.listW,
    this.listH
  );

  let dragging = false;
  let lastY = 0;
  let moved = 0;

  this.input.setTopOnly(false);

  this.input.on("pointerdown", (p) => {
    if (!this.listRect.contains(p.x, p.y)) return;
    dragging = true;
    lastY = p.y;
    moved = 0;
  });

  this.input.on("pointermove", (p) => {
    if (!dragging || !p.isDown) return;
    const delta = p.y - lastY;
    lastY = p.y;
    moved += Math.abs(delta);
    this.setScroll(this.scrollY + delta);
  });

  this.input.on("pointerup", (p) => {
    dragging = false;

    // si le doigt a bougé => on annule le click sur les boutons
    if (moved > 8) p.event?.stopPropagation?.();
  });
}


  setScroll(y) {
    const minScroll = Math.min(0, this.listH - this.listContentH);
    const maxScroll = 0;

    this.scrollY = Phaser.Math.Clamp(y, minScroll, maxScroll);
    this.bakerList.y = this.listY + this.scrollY;
  }

  // ---------- Monster logic ----------
  monsterKey() {
    const isBoss = this.state.zone % 10 === 0;
    if (isBoss) {
      return Math.floor(this.state.zone / 10) % 2 === 0 ? "mb1" : "mb2";
    }
    const idx = (this.state.zone - 1) % 9;
    return ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9"][idx];
  }

  tapMonster() {
    this.damageMonster(this.state.tapDamage);
    this.spawnCrumbs(this.monsterImage.x, this.monsterImage.y);

    const base = this.monsterBaseScale;
    this.monsterImage.setScale(base * 0.94);

    this.tweens.add({
      targets: this.monsterImage,
      scaleX: base,
      scaleY: base,
      duration: 90,
      ease: "quad.out",
    });
  }

  damageMonster(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;

    this.state.monsterHp -= amount;

    if (!Number.isFinite(this.state.monsterHp) || this.state.monsterHp < 0) {
      this.state.monsterHp = 0;
    }

    const eps = Math.max(1e-3, this.state.monsterHpMax * 0.001);

    if (this.state.monsterHp <= eps) {
      this.state.monsterHp = 0;
      this.killMonster();
    }
  }

  killMonster() {
    const m = computeMonsterForZone(this.state.zone);
    this.state.sugar += m.reward;

    this.state.zone += 1;
    const next = computeMonsterForZone(this.state.zone);
    this.state.monsterHpMax = next.hpMax;
    this.state.monsterHp = next.hpMax;

    this.monsterImage.setTexture(this.monsterKey());
    const targetMonsterWidth = this.scale.width * 0.5;
    this.monsterImage.setScale(targetMonsterWidth / this.monsterImage.width);
    this.monsterBaseScale = this.monsterImage.scaleX;

    this.spawnCrumbs(this.monsterImage.x, this.monsterImage.y, 12);
  }

  // ---------- Bakers cards ----------
  createBakerCard(cfg, index, localY) {
    const cardX = 10;
    const cardY = localY;

    const root = this.add.container(0, 0);

    const shadow = this.add
      .rectangle(cardX + 2, cardY + 3, 316, 68, 0x000000, 0.06)
      .setOrigin(0);

    const card = this.add
      .rectangle(cardX, cardY, 316, 68, 0xffffff)
      .setOrigin(0)
      .setStrokeStyle(2, 0xe0e7f5, 1)
      .setAlpha(0.8);

    const icon = this.add
      .image(cardX + 30, cardY + 34, cfg.icon)
      .setOrigin(0.5);
    this.scaleToFit(icon, 56, 56);

    const name = this.add.text(cardX + 60, cardY + 18, cfg.name, {
      fontFamily: "Baloo 2, system-ui",
      fontSize: "15px",
      color: "#1F2A44",
      fontStyle: "700",
    });

    const info = this.add.text(cardX + 60, cardY + 36, "", {
      fontFamily: "Baloo 2, system-ui",
      fontSize: "12px",
      color: "#6B7A95",
      fontStyle: "600",
    });

    const buyShadow = this.add
      .rectangle(cardX + 227, cardY + 14, 76, 44, 0x000000, 0.12)
      .setOrigin(0);

    const buyBtn = this.add
      .rectangle(cardX + 226, cardY + 12, 76, 44, 0x026d5a)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    const buyText = this.add
      .text(cardX + 265, cardY + 35, "BUY", {
        fontFamily: "Baloo 2, system-ui",
        fontSize: "13px",
        color: "#FFFFFF",
        fontStyle: "700",
      })
      .setOrigin(0.5);

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

    root.add([shadow, card, icon, name, info, buyShadow, buyBtn, buyText]);

    return {
      root,
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
    if (!this.state.bakers[i]) this.state.bakers[i] = { level: 0 };

    const lvl = this.state.bakers[i].level ?? 0;
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

    this.state.tapDamage = computeTapDamage(this.state) || 1;
    const dps = computeTotalDps(this.state) || 0;

    const bossTag = computeMonsterForZone(this.state.zone).isBoss
      ? " • BOSS"
      : "";
    this.zoneText.setText(`Zone ${this.state.zone}${bossTag}`);

    const dpsShown =
      dps < 1 ? dps.toFixed(2) : dps < 10 ? dps.toFixed(1) : fmt(dps);

    this.dpsText.setText(
      `DPS ${dpsShown}  •  Tap ${fmt(this.state.tapDamage)}`
    );

    const ratio = Phaser.Math.Clamp(
      this.state.monsterHp / this.state.monsterHpMax,
      0,
      1
    );

    const hpX = 60,
      hpY = 318,
      hpW = 240,
      hpH = 18,
      r = 9;
    const w = hpW * ratio;

    this.hpBarFill.clear();
    if (w > 0.5) {
      this.hpBarFill.fillStyle(
        computeMonsterForZone(this.state.zone).isBoss ? 0xe0584e : 0xffb454,
        1
      );
      this.hpBarFill.fillRoundedRect(hpX, hpY, w, hpH, r);
    }

    const hpShown = Math.ceil(this.state.monsterHp);
    const hpMaxShown = Math.ceil(this.state.monsterHpMax);
    this.hpText.setText(`${fmt(hpShown)} / ${fmt(hpMaxShown)}`);

    // Cards
    this.cards.forEach((c) => {
      const bakerState = this.state.bakers[c.index] || { level: 0 };
      const lvl = bakerState.level ?? 0;
      const cost = bakerCost(c.cfg, lvl);

      if (c.cfg.tapBase) {
        const tapOne = bakerTap(c.cfg, lvl || 1);
c.info.setText(`Lvl ${lvl} • Tap +${fmt(tapOne)} • Cost ${fmt(cost)}`);
      } else {
        const dpsOne = bakerDps(c.cfg, lvl) || 0; // DPS du prochain achat
        const dpsTotal = bakerTotalDps(c.cfg, lvl) || 0; // DPS total de ce tier

        const dpsOneShown =
          dpsOne < 1
            ? dpsOne.toFixed(2)
            : dpsOne < 10
            ? dpsOne.toFixed(1)
            : fmt(dpsOne);

        const dpsTotalShown =
          dpsTotal < 1
            ? dpsTotal.toFixed(2)
            : dpsTotal < 10
            ? dpsTotal.toFixed(1)
            : fmt(dpsTotal);

        c.info.setText(
          `Lvl ${lvl} • DPS ${dpsTotalShown} • Cost ${fmt(cost)}`
        );
      }

      const affordable = this.state.sugar >= cost;
      c.buyBtn.fillColor = affordable ? 0x026d5a : 0x9bb3c9;
      c.buyText.setText(affordable ? "BUY" : "LOCK");
    });

    this.listContentH = this.cardGap + BAKERS.length * this.cardH;
    this.setScroll(this.scrollY);
  }

  refreshThrottled() {
    if (!this._uiTimer || this._uiTimer < this.time.now) {
      this.refreshAll();
      this._uiTimer = this.time.now + 150;
    }
  }

  // ---------- Offline popup ----------
  showOfflinePopup({ elapsedSec, gained }, UI_DEPTH) {
    const w = 300,
      h = 140;
    const x = (360 - w) / 2;
    const y = 160;

    const shadow = this.add
      .rectangle(x + 2, y + 4, w, h, 0x000000, 0.1)
      .setOrigin(0)
      .setDepth(UI_DEPTH + 5);

    const panel = this.add
      .rectangle(x, y, w, h, 0xffffff, 1)
      .setOrigin(0)
      .setDepth(UI_DEPTH + 5);

    panel.setStrokeStyle(2, 0xe0e7f5, 1);

    const txt = this.add
      .text(
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
      )
      .setDepth(UI_DEPTH + 6);

    const btnShadow = this.add
      .rectangle(x + 16, y + 82, w - 28, 46, 0x000000, 0.12)
      .setOrigin(0)
      .setDepth(UI_DEPTH + 5);

    const btn = this.add
      .rectangle(x + 14, y + 81, w - 28, 46, 0x026d5a)
      .setOrigin(0)
      .setStrokeStyle(2, 0x026d5a)
      .setInteractive({ useHandCursor: true })
      .setDepth(UI_DEPTH + 6);

    const btntxt = this.add
      .text(x + w / 2, y + 105, "COLLECT", {
        fontFamily: "Baloo 2, system-ui",
        fontSize: "14px",
        color: "#FFFFFF",
        fontStyle: "700",
      })
      .setOrigin(0.5)
      .setDepth(UI_DEPTH + 7);

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
