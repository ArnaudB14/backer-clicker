import BootScene from "./scenes/BootScene";
import GameScene from "./scenes/GameScene";

export const gameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "transparent",

  // Plus de pixels internes = texte plus net même si FIT scale
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
    autoRound: true,   // évite les tailles CSS fractionnaires
  },

  scene: [BootScene, GameScene],
};
