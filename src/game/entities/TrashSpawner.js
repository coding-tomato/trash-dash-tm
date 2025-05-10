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
      "nonRecyclable",
    ];
    this.lastSpawnTime = 0;
    this.spawnInterval = 3000; // Spawn new trash every 2 seconds
    this.spawnArea = spawnArea;
    this.activeCollisionIndex = null; // Track which trash item is currently active for disposal
  }

  update(deltaTime) {
    const currentTime = Date.now();

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
          console.log("Active collision item was removed");
        }
        // If we're removing an item before the active collision, adjust the index
        else if (this.activeCollisionIndex !== null && i < this.activeCollisionIndex) {
          this.activeCollisionIndex--;
          console.log("Adjusting activeCollisionIndex to", this.activeCollisionIndex);
        }
      }
    }
    
    // Filter out items that return false from update (they've completed their lifecycle)
    this.trashItems = this.trashItems.filter(trash => {
      // Keep items that are still valid and have not exceeded their lifespan
      return trash.mesh !== null && Date.now() - trash.createdAt < trash.lifespan;
    });
    
    // Sanity check - if the array length changed unexpectedly
    if (oldLength - removedCount !== this.trashItems.length) {
      console.log("Warning: Unexpected array length change", 
                oldLength, removedCount, this.trashItems.length);
      
      // If the activeCollisionIndex is out of bounds after filtering, reset it
      if (this.activeCollisionIndex !== null && 
          this.activeCollisionIndex >= this.trashItems.length) {
        console.log("Resetting out-of-bounds activeCollisionIndex");
        this.activeCollisionIndex = null;
      }
    }
  }

  spawnTrash() {
    const randomType =
      this.trashTypes[Math.floor(Math.random() * this.trashTypes.length)];

    const position = new THREE.Vector3(-5, 0.5, 0);

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
    this.trashItems.forEach((trash) => {
      if (trash && typeof trash.destroy === 'function') {
        trash.destroy();
      }
    });
    this.trashItems = [];
    this.activeCollisionIndex = null;
    console.log("TrashSpawner destroyed and reset");
  }
}

export default TrashSpawner;
