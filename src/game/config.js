import BootScene from "./scenes/BootScene";
import GameScene from "./scenes/GameScene";

export const gameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "transparent",
  resolution: window.devicePixelRatio || 1,   // <-- clé du net

  render: {
    antialias: true,
    roundPixels: true,                        // <-- aide le texte
  },

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 360,
    height: 640,
  },

  scene: [BootScene, GameScene],
};
