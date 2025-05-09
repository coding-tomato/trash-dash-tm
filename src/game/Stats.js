class Stats {
  constructor() {
    this.score = 0;
    this.level = 1;
    this.isPlaying = true;
    this.collisionsCount = 0;
  }

  addScore(amount) {
    this.score += amount;
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
    this.level = 1;
    this.isPlaying = true;
    this.collisionsCount = 0;
  }

  getState() {
    return {
      score: this.score,
      level: this.level,
      isPlaying: this.isPlaying,
      collisionsCount: this.collisionsCount,
    };
  }
}

export default Stats;
