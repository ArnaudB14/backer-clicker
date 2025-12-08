import { load, applyOfflineProgress } from "../systems/save";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Monsters chibi (load.image pour SVG)
    this.load.image("m1", "assets/monsters/monster1.png");
    this.load.image("m2", "assets/monsters/monster2.png");
    this.load.image("m3", "assets/monsters/monster3.png");
    this.load.image("m4", "assets/monsters//monster4.png");
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

    // UI
    this.load.image("sugarIcon", "assets/ui/icon_sugar.svg");
    this.load.image("crumb", "assets/ui/crumb.svg");
  }

  create() {
    const state = load();
    const offline = applyOfflineProgress(state);

    this.registry.set("state", state);
    this.registry.set("offline", offline);

    this.scene.start("GameScene");
  }
}
