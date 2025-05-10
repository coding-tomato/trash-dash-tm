import { CONFIG } from "../config";

class Stats {
  constructor() {
    this.score = 0;
    this.totalScore = 0;
    this.level = 0;
    this.currentScene = CONFIG.SCENES.MAIN_MENU;
    this.isPlaying = true;
    this.collisionsCount = 0;
  }

  addScore(amount) {
    this.score += amount;
    this.totalScore += amount;
  }

  setCurrentScene(scene) {
    this.currentScene = scene;
  }

  setLevel(level) {
    this.level = level;
  }

  setPlaying(isPlaying) {
    this.isPlaying = isPlaying;
  }

  incrementCollisions() {
    this.collisionsCount++;
  }

  reset() {
    this.score = 0;
    this.level = 0;
    this.isPlaying = true;
    this.collisionsCount = 0;
    this.currentScene = CONFIG.SCENES.MAIN_MENU;
  }

  getState() {
    return {
      score: this.score,
      totalScore: this.totalScore,
      level: this.level,
      isPlaying: this.isPlaying,
      collisionsCount: this.collisionsCount,
      currentScene: this.currentScene,
    };
  }
}

export default Stats;
