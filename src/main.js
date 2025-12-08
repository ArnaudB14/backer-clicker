import Phaser from "phaser";
import { gameConfig } from "./game/config";
import "./style.css";

const game = new Phaser.Game(gameConfig);

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const scale = Math.min(w / 360, h / 640);

  const canvas = game.canvas;
}

window.addEventListener("resize", resize);
resize();
