import * as THREE from "three";
import Trash from "./Trash";

class TrashSpawner {
  constructor(scene, spawnSound) {
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
    this.trashSpawnPosition = new THREE.Vector3(-2.5, 1, 0);
    this.lastSpawnTime = 0;
    this.activeCollisionIndex = null;
    this.spawnSpeedupTimer = 0;
    this.spawnInterval = 4000; // Start at 4s
    this.spawnIntervalMin = 800; // Minimum interval (1s)
    this.spawnIntervalDecrement = 700; // Decrease by 0.5s each time
    this.spawnSpeedupPeriod = 15000; //
    this.onSpawn = null; // Callback function for spawn events
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

    // Store the current length before filtering
    const oldLength = this.trashItems.length;

    // Keep track of indices to update activeCollisionIndex if needed
    let removedCount = 0;
    for (let i = 0; i < oldLength; i++) {
      const isActive = i === this.activeCollisionIndex;
      const stillActive = this.trashItems[i].update(deltaTime);

      if (!stillActive) {
        removedCount++;
        // If we're removing the active collision item
        if (isActive) {
          this.activeCollisionIndex = null;
        }
        // If we're removing an item before the active collision, adjust the index
        else if (
          this.activeCollisionIndex !== null &&
          i < this.activeCollisionIndex
        ) {
          this.activeCollisionIndex--;
        }
      }
    }

    // Filter out items that return false from update (they've completed their lifecycle)
    this.trashItems = this.trashItems.filter((trash) => {
      // Keep items that are still valid and have not exceeded their lifespan
      // Also check if the trash item has been marked for deletion
      return (
        trash &&
        trash.mesh !== null &&
        Date.now() - trash.createdAt < trash.lifespan &&
        !trash.isDestroyed
      );
    });

    // Sanity check - if the array length changed unexpectedly
    if (oldLength - removedCount !== this.trashItems.length) {
      // If the activeCollisionIndex is out of bounds after filtering, reset it
      if (
        this.activeCollisionIndex !== null &&
        this.activeCollisionIndex >= this.trashItems.length
      ) {
        this.activeCollisionIndex = null;
      }
    }
  }

  spawnTrash() {
    const randomType =
      this.trashTypes[Math.floor(Math.random() * this.trashTypes.length)];

    const position = this.trashSpawnPosition;

    const newTrash = new Trash(this.scene, randomType, position);
    this.trashItems.push(newTrash);

    if (this.spawnSound) {
      if (this.spawnSound.isPlaying) {
        this.spawnSound.stop();
      }
      this.spawnSound.play();
    }
    else {
      console.warn("Spawn sound not set or not available.");
    }
  }

  getTrashItems() {
    return this.trashItems;
  }

  destroy() {
    this.trashItems.forEach((trash) => {
      if (trash && typeof trash.destroy === "function") {
        trash.destroy();
      }
    });
    this.trashItems = [];
    this.activeCollisionIndex = null;
  }
}

export default TrashSpawner;
