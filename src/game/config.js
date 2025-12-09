import BootScene from "./scenes/BootScene";
import GameScene from "./scenes/GameScene";

export const gameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "transparent",

  input: {
    activePointers: 3,
    touch: {
      capture: true
    }
  },

  resolution: Math.min(3, window.devicePixelRatio || 1),

  render: {
    antialias: true,
    roundPixels: true,
  },

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 360,
    height: 640,
    autoRound: true,
  },

  scene: [BootScene, GameScene],
};
