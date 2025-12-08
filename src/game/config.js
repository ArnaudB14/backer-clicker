import BootScene from "./scenes/BootScene";
import GameScene from "./scenes/GameScene";

export const gameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: 360,
  height: 640,

  resolution: Math.max(1, window.devicePixelRatio || 1),

  scale: {
    mode: Phaser.Scale.NONE,          // pas de resize automatique
    autoCenter: Phaser.Scale.NO_CENTER // IMPORTANT
  },

  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },

  scene: [BootScene, GameScene],
};

