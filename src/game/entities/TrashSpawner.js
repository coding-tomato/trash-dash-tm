import * as THREE from "three";
import Trash from "./Trash";

class TrashSpawner {
  constructor(scene, spawnArea = { width: 40, depth: 40, height: 20 }) {
    this.scene = scene;
    this.trashItems = [];
    this.trashTypes = [
      "plastic",
      "glass",
      "metal",
      "organic",
    ];
    this.lastSpawnTime = 0;
    this.spawnInterval = 1500; // Spawn new trash every 2 seconds
    this.spawnArea = spawnArea;
    this.activeCollisionIndex = null; // Track which trash item is currently active for disposal
  }

  update(deltaTime) {
    const currentTime = Date.now();

    if (currentTime - this.lastSpawnTime > this.spawnInterval) {
      this.spawnTrash();
      this.lastSpawnTime = currentTime;
    }

    this.trashItems = this.trashItems.filter((trash) =>
      trash.update(deltaTime)
    );
  }

  spawnTrash() {
    const randomType =
      this.trashTypes[Math.floor(Math.random() * this.trashTypes.length)];

    const position = new THREE.Vector3(-10, 1, 0);

    const newTrash = new Trash(this.scene, randomType, position);
    this.trashItems.push(newTrash);
  }

  getTrashItems() {
    return this.trashItems;
  }
  
  checkCombinationsForDisposal(combo) {
    const disposedTrash = [];
    
    this.trashItems.forEach((trash, index) => {
      if (trash.isCollidingWithPlayer && trash.checkCombination(combo)) {
        disposedTrash.push(index);
      }
    });
    
    return disposedTrash;
  }

  destroy() {
    this.trashItems.forEach((trash) => trash.destroy());
    this.trashItems = [];
  }
}

export default TrashSpawner;
