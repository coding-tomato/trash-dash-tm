import { CONFIG } from "../config";

class Stats {
  constructor() {
    this.score = 0;
    this.currentScene = CONFIG.SCENES.MAIN_MENU;
    this.isPlaying = true;
  }

  addScore(amount) {
    if (this.score + amount < 0) {
      this.score = 0;
    } else {
      this.score += amount;
    }
  }

  setCurrentScene(scene) {
    this.currentScene = scene;
  }

  setPlaying(isPlaying) {
    this.isPlaying = isPlaying;
  }

  reset() {
    this.score = 0;
    this.isPlaying = true;
    this.currentScene = CONFIG.SCENES.MAIN_MENU;
  }

  getState() {
    return {
      score: this.score,
      isPlaying: this.isPlaying,
      currentScene: this.currentScene,
    };
  }
}

export default Stats;
