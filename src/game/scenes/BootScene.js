import { load, applyOfflineProgress } from "../systems/save";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    const state = load();
    const offline = applyOfflineProgress(state);

    this.registry.set("state", state);
    this.registry.set("offline", offline);

    this.scene.start("GameScene");
  }
}
