import Phaser from "phaser";
import { gameConfig } from "./game/config";
import "./style.css";

const game = new Phaser.Game(gameConfig);

const refresh = () => {
  game.scale.refresh();
};

window.addEventListener("resize", refresh);
window.addEventListener("orientationchange", refresh);
refresh();
