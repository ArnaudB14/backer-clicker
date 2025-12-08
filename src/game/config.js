export const gameConfig = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  backgroundColor: "#0b0f1a",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  fps: {
    target: 60,
    forceSetTimeOut: true,
  },
};
