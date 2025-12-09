import { load, applyOfflineProgress } from "../systems/save";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    const { width, height } = this.scale;

    this.load.image("bootBg", "assets/bg/background3.png");
    this.load.image("bootLogo", "logo-fond.png");

    this.load.once("complete", () => {
      this.showLoadingScreen();

      this.loadGameAssets();

      this.load.on("progress", (p) => {
        const pct = Math.floor(p * 100);
        if (this.loadingText) this.loadingText.setText(`Loading ${pct}%`);
      });

      this.load.once("complete", () => {
        this.startGame();
      });

      this.load.start();
    });

    this.load.start();
  }

  showLoadingScreen() {
    const { width, height } = this.scale;

    this.bootBg = this.add.image(width / 2, height / 2, "bootBg").setOrigin(0.5);
    const s = Math.max(width / this.bootBg.width, height / this.bootBg.height);
    this.bootBg.setScale(s).setScrollFactor(0);

    this.bootLogo = this.add.image(width / 2, height * 0.45, "bootLogo")
      .setOrigin(0.5);

    const targetW = width * 0.55;
    const baseScale = targetW / this.bootLogo.width;
    this.bootLogo.setScale(baseScale);

    this.tweens.add({
      targets: this.bootLogo,
      scale: baseScale * 1.05,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    this.loadingText = this.add
      .text(width / 2, height * 0.7, "Loading 0%", {
        fontFamily: "Baloo 2, system-ui",
        fontSize: "16px",
        color: "#1F2A44",
        fontStyle: "700",
      })
      .setOrigin(0.5);
  }

  loadGameAssets() {
    // Monsters
    this.load.image("m1", "assets/monsters/monster1.png");
    this.load.image("m2", "assets/monsters/monster2.png");
    this.load.image("m3", "assets/monsters/monster3.png");
    this.load.image("m4", "assets/monsters/monster4.png");
    this.load.image("m5", "assets/monsters/monster5.png");
    this.load.image("m6", "assets/monsters/monster6.png");
    this.load.image("m7", "assets/monsters/monster7.png");
    this.load.image("m8", "assets/monsters/monster8.png");
    this.load.image("m9", "assets/monsters/monster9.png");
    this.load.image("mb1", "assets/monsters/monster_boss1.png");
    this.load.image("mb2", "assets/monsters/monster_boss2.png");

    // Bakers
    this.load.image("baker1", "assets/bakers/baker1.png");
    this.load.image("baker2", "assets/bakers/baker2.png");
    this.load.image("baker3", "assets/bakers/baker3.png");
    this.load.image("baker4", "assets/bakers/baker4.png");
    this.load.image("baker5", "assets/bakers/baker5.png");
    this.load.image("baker6", "assets/bakers/baker6.png");
    this.load.image("baker7", "assets/bakers/baker7.png");
    this.load.image("baker8", "assets/bakers/baker8.png");
    this.load.image("tap", "assets/bakers/tap.png");

    // UI
    this.load.image("sugarIcon", "logo-transparent.png");
    this.load.image("crumb", "assets/ui/crumb.svg");

    // Background in-game (même que boot, mais key bg1 pour GameScene)
    this.load.image("bg1", "assets/bg/background3.png");
  }

  startGame() {
    const state = load();
    const offline = applyOfflineProgress(state);

    this.registry.set("state", state);
    this.registry.set("offline", offline);

    this.scene.start("GameScene");
  }
}
