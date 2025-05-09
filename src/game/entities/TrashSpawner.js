import * as THREE from "three";

class Trash {
  constructor(scene, type, position) {
    this.scene = scene;
    this.type = type; // 'glass' or 'plastic'
    this.position = position;
    this.velocity = new THREE.Vector3(1, 0, 0); // Moving sideways
    this.speed = 2; // Movement speed
    this.lifespan = 20000; // 20 seconds in milliseconds
    this.createdAt = Date.now();
    this.mesh = null;
    this.collider = null;
    
    // Collision state
    this.isCollidingWithPlayer = false;
    this.collisionStartTime = null;
    this.disposalTimeLimit = 3000; // 3 seconds to input the correct combination
    
    // Define key combinations required for disposal based on trash type
    this.requiredCombination = this.getRequiredCombination();

    this.createMesh();
    this.createCollider();
  }

  getRequiredCombination() {
    switch(this.type) {
      case "glass":
        return ["up", "down", "up", "down"];
      case "plastic":
        return ["left", "right", "left", "right"];
      default:
        return ["up", "up", "up", "up"];
    }
  }

  createMesh() {
    let geometry;
    let material;

    if (this.type === "glass") {
      geometry = new THREE.ConeGeometry(1, 2, 4);
      material = new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.8,
        roughness: 0.1,
        metalness: 0.5,
      });
    } else if (this.type === "plastic") {
      geometry = new THREE.SphereGeometry(1, 16, 16);
      material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        roughness: 0.5,
      });
    }

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.scene.add(this.mesh);
  }

  createCollider() {
    // Create a Box3 collider for the trash item
    this.collider = new THREE.Box3().setFromObject(this.mesh);
  }

  update(deltaTime) {
    // Always move trash according to velocity and speed, regardless of collision state
    const movement = this.velocity
      .clone()
      .multiplyScalar(this.speed * deltaTime);
    this.mesh.position.add(movement);
    
    // If colliding, add visual effect but don't stop movement
    if (this.isCollidingWithPlayer) {
      // Visual indicator that it's in "disposal mode" - slight up/down movement
      this.mesh.position.y += Math.sin(Date.now() * 0.01) * 0.01;
      
      // Check if disposal time limit is exceeded
      if (Date.now() - this.collisionStartTime > this.disposalTimeLimit) {
        this.resetCollision();
      }
      
      // Check if trash has moved too far from player (opportunity window closed)
      const playerPosition = new THREE.Vector3(0, 1, 0); // Assuming player is at this position
      if (this.mesh.position.distanceTo(playerPosition) > 5) {
        this.resetCollision();
      }
    }

    // Update collider to match the new position
    this.collider.setFromObject(this.mesh);

    // Check if trash should be destroyed (after lifespan)
    if (Date.now() - this.createdAt >= this.lifespan) {
      this.destroy();
      return false; // Signal that this object should be removed
    }

    return true; // Object still active
  }

  startCollision() {
    if (!this.isCollidingWithPlayer) {
      this.isCollidingWithPlayer = true;
      this.collisionStartTime = Date.now();
      this.position = this.mesh.position.clone(); // Store the position when collision starts
      
      // Change material to indicate collision state
      if (this.mesh.material) {
        this.mesh.material.emissive = new THREE.Color(0x553311);
        this.mesh.material.emissiveIntensity = 0.5;
      }
    }
  }

  resetCollision() {
    this.isCollidingWithPlayer = false;
    this.collisionStartTime = null;
    
    // Reset material appearance
    if (this.mesh.material) {
      this.mesh.material.emissive = new THREE.Color(0x000000);
      this.mesh.material.emissiveIntensity = 0;
    }
  }

  checkCombination(inputCombo) {
    // Return false if not currently in collision
    if (!this.isCollidingWithPlayer) {
      return false;
    }
    
    // Check if the last N inputs match our required combination
    // where N is the length of the required combination
    const requiredLength = this.requiredCombination.length;
    const lastInputs = inputCombo.slice(-requiredLength);
    
    if (lastInputs.length < requiredLength) {
      return false;
    }
    
    // Check if combinations match
    for (let i = 0; i < requiredLength; i++) {
      if (lastInputs[i] !== this.requiredCombination[i]) {
        return false;
      }
    }
    
    // Combination matches!
    return true;
  }

  getCollisionType() {
    return this.type;
  }

  destroy() {
    // Remove the mesh from the scene and dispose of resources
    if (this.mesh && this.scene) {
      this.scene.remove(this.mesh);
      if (this.mesh.geometry) this.mesh.geometry.dispose();
      if (this.mesh.material) this.mesh.material.dispose();
      this.mesh = null;
    }

    this.collider = null;
  }
}

class TrashSpawner {
  constructor(scene, spawnArea = { width: 40, depth: 40, height: 20 }) {
    this.scene = scene;
    this.trashItems = [];
    this.trashTypes = ["glass", "plastic"];
    this.lastSpawnTime = 0;
    this.spawnInterval = 2000; // Spawn new trash every 1 second
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

    const position = new THREE.Vector3(-20, 2, 0);

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
