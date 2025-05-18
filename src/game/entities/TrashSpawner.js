import * as THREE from "three";
import Trash from "./Trash";

class TrashSpawner {
  constructor(scene, spawnSound, onTrashChange) {
    this.scene = scene;
    this.trashItems = [];
    this.trashTypes = [
      "metal_and_plastic",
      "glass",
      "organic",
      "paper",
      "nonRecyclable",
    ];
    this.spawnSound = spawnSound;
    this.onTrashChange = onTrashChange;
    this.trashSpawnPosition = new THREE.Vector3(-2.5, 1, 0);
    this.lastSpawnTime = 0;
    this.spawnSpeedupTimer = 0;
    this.spawnInterval = 4000; // Start at 4s
    this.spawnIntervalMin = 800; // Minimum interval (1s)
    this.spawnIntervalDecrement = 700; // Decrease by 0.5s each time
    this.spawnSpeedupPeriod = 15000; //
  }

  update(deltaTime) {
    const currentTime = Date.now();

    // Speed up spawn every 45 seconds
    if (!this.spawnSpeedupTimer) this.spawnSpeedupTimer = currentTime;
    if (currentTime - this.spawnSpeedupTimer > this.spawnSpeedupPeriod) {
      this.spawnSpeedupTimer = currentTime;
      this.spawnInterval = Math.max(
        this.spawnIntervalMin,
        this.spawnInterval - this.spawnIntervalDecrement
      );
    }

    if (currentTime - this.lastSpawnTime > this.spawnInterval) {
      this.spawnTrash();
      this.lastSpawnTime = currentTime;
    }

    this.trashItems.forEach((trash) => trash.update(deltaTime));
  }

  spawnTrash() {
    const randomType =
      this.trashTypes[Math.floor(Math.random() * this.trashTypes.length)];

    const position = this.trashSpawnPosition;

    const newTrash = new Trash(this.scene, randomType, position, () => {
      this.removeActiveTrash()
    });
    this.trashItems.push(newTrash);

    if (this.spawnSound) {
      if (this.spawnSound.isPlaying) {
        this.spawnSound.stop();
      }
      this.spawnSound.play();
    } else {
      console.warn("Spawn sound not set or not available.");
    }
  }

  getTrashItems() {
    return this.trashItems;
  }

  getActiveTrash() {
    return this.trashItems[0];
  }

  removeActiveTrash() {
    const activeTrash = this.getActiveTrash();
    activeTrash.destroy();
    this.trashItems.splice(0, 1);
    this.onTrashChange()
  }

  destroy() {
    this.trashItems.forEach((trash) => trash.destroy());
    this.trashItems = [];
  }
}

export default TrashSpawner;
