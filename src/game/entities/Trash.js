import * as THREE from "three";
import assetLoader from "../AssetLoader";
import { CONFIG } from "../../config";

class Trash {
  constructor(scene, type, position) {
    this.scene = scene;
    this.type = type; // 'glass', 'plastic', 'metal', or 'organic'
    this.position = position;
    this.velocity = new THREE.Vector3(1, 0, 0);
    this.speed = 0.5;
    this.lifespan = 20000;
    this.createdAt = Date.now();
    this.mesh = null;
    this.collider = null;
    this.colliderMesh = null; // Add property for collider visualization
    this.modelName = this.selectRandomModel(type);

    // Collision state
    this.isCollidingWithPlayer = false;
    this.maxCollisionDistance = 5; // Maximum distance to player to maintain collision
    this.lastCollisionCheck = Date.now();  // Add a timestamp to track collisions
    this.collisionTimeout = 20000; // 3 seconds maximum collision time as a safety mechanism

    // Define key combinations required for disposal based on trash type
    this.requiredCombination = this.getRequiredCombination();

    this.createMesh();
    this.createCollider();
  }

  getRequiredCombination() {
    return CONFIG.TRASH_COMBINATIONS[this.type] || CONFIG.TRASH_COMBINATIONS.nonRecyclable;
  }

  selectRandomModel(type) {
    // Models categorized by type
    const models = {
      glass: ["botellaVino", "botellin", "copaRota", "botellaLicor"],
      plastic: ["botellaPlastico", "bolsa"],
      metal: ["sodaCan", "lataAtun", "movil"],
      organic: [
        "bananaPeel",
        "manzana",
        "musloPollo",
        "pizzaSlice",
        "eggShell",
      ],
      nonRecyclable: ["jeringuilla", "bateria"],
    };

    // Pick a random model from the appropriate category
    if (models[type] && models[type].length > 0) {
      const randomIndex = Math.floor(Math.random() * models[type].length);
      return models[type][randomIndex];
    }

    // Fallbacks if no models are found
    switch (type) {
      case "glass":
        return "botellaVino";
      case "plastic":
        return "botellaPlastico";
      case "metal":
        return "sodaCan";
      case "organic":
        return "bananaPeel";
      default:
        return "sodaCan";
    }
  }

  createMesh() {
    // If assetLoader has our models, use them
    if (assetLoader.isLoaded) {
      const fbx = assetLoader.getModel(this.modelName);
      if (fbx) {
        // Set the model material based on type for visual identification
        fbx.traverse((child) => {
          if (child.isMesh) {
            switch (this.type) {
              case "glass":
                child.material = new THREE.MeshPhysicalMaterial({
                  color: 0x88ccff,
                  transparent: true,
                  opacity: 0.8,
                  roughness: 0.1,
                  metalness: 0,
                  transmission: 0.5, // Glass transparency
                  clearcoat: 1.0,
                });
                break;
              case "plastic":
                child.material = new THREE.MeshStandardMaterial({
                  color: 0xffcc99,
                  transparent: true,
                  opacity: 0.9,
                  roughness: 0.5,
                  metalness: 0.1,
                });
                break;
              case "metal":
                child.material = new THREE.MeshStandardMaterial({
                  color: 0xffffff,
                  roughness: 0.2,
                  metalness: 0.5,
                });
                break;
              case "organic":
                child.material = new THREE.MeshStandardMaterial({
                  color: 0x99cc66,
                  roughness: 0.8,
                  metalness: 0.0,
                });
                break;
              case "nonRecyclable":
                child.material = new THREE.MeshStandardMaterial({
                  color: 0xff0000,
                  roughness: 0.5,
                  metalness: 0.1,
                });
                break;
            }
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.flatShading = true;
          }
        });

        fbx.position.copy(this.position);
        this.mesh = fbx;
        this.scene.add(fbx);

        // Create the collider here for FBX models
        const size = new THREE.Vector3(2, 2, 2);
        this.collider = new THREE.Box3(
          this.position.clone().sub(size.clone().multiplyScalar(0.5)),
          this.position.clone().add(size.clone().multiplyScalar(0.5))
        );
        return;
      }
    }

    // Fallback if model loading fails: use basic geometry
    let geometry;
    let material;

    switch (this.type) {
      case "glass":
        geometry = new THREE.ConeGeometry(1, 2, 4);
        material = new THREE.MeshPhysicalMaterial({
          color: 0x88ccff,
          transparent: true,
          opacity: 0.8,
          roughness: 0.1,
          metalness: 0,
          transmission: 0.5,
        });
        break;
      case "plastic":
        geometry = new THREE.SphereGeometry(1, 16, 16);
        material = new THREE.MeshStandardMaterial({
          color: 0xffcc99,
          transparent: true,
          opacity: 0.9,
          roughness: 0.5,
        });
        break;
      case "metal":
        geometry = new THREE.BoxGeometry(1, 1, 2);
        material = new THREE.MeshStandardMaterial({
          color: 0x88ccff,
          roughness: 0.2,
          metalness: 1.0,
        });
        break;
      case "organic":
        geometry = new THREE.TorusGeometry(0.8, 0.4, 16, 32);
        material = new THREE.MeshStandardMaterial({
          color: 0x99cc66,
          roughness: 0.8,
        });
        break;
      case "nonRecyclable":
        geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
        material = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          roughness: 0.5,
        });
        break;
      default:
        geometry = new THREE.SphereGeometry(1, 16, 16);
        material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
        });
    }

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
  }

  createCollider() {
    const size = new THREE.Vector3(2, 2, 2);
    const center = this.position.clone();
    this.collider = new THREE.Box3(
      center.clone().sub(size.clone().multiplyScalar(0.5)),
      center.clone().add(size.clone().multiplyScalar(0.5))
    );

    // Create a wireframe visualization of the collider
    const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff, // Different color from player collider
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    this.colliderMesh = new THREE.Mesh(boxGeometry, wireframeMaterial);
    this.colliderMesh.position.copy(center);
    this.colliderMesh.visible = CONFIG.DEBUG; // Only show in debug mode
    this.scene.add(this.colliderMesh);
  }

  update(deltaTime) {
    // Always move trash according to velocity and speed, regardless of collision state
    const movement = this.velocity
      .clone()
      .multiplyScalar(this.speed * deltaTime);
    this.mesh.position.add(movement);

    // Make the trash spin slightly all the time
    if (this.mesh) {
      this.mesh.rotation.y += 0.01;
    }

    // If colliding, add visual effect but don't stop movement
    if (this.isCollidingWithPlayer) {
      // Visual indicator that it's in "disposal mode" - slight up/down movement
      this.mesh.position.y += Math.sin(Date.now() * 0.01) * 0.01;

      // Check if collision has timed out (safety mechanism)
      if (Date.now() - this.lastCollisionCheck > this.collisionTimeout) {
        console.log("Collision timeout reached for trash:", this.type);
        this.resetCollision();
      }

      // Check if trash has moved too far from player (opportunity window closed)
      // We'll use the original fixed position as a reference point
      const playerPosition = new THREE.Vector3(0, 1, -1); // Player's typical position
      if (this.mesh.position.distanceTo(playerPosition) > this.maxCollisionDistance) {
        this.resetCollision();
      }
    }

    // Update collider position
    const size = new THREE.Vector3(2, 2, 2);
    this.collider.min.copy(
      this.mesh.position.clone().sub(size.clone().multiplyScalar(0.5))
    );
    this.collider.max.copy(
      this.mesh.position.clone().add(size.clone().multiplyScalar(0.5))
    );
    
    // Update the wireframe collider visualization position
    if (this.colliderMesh) {
      // Calculate center of the collider box
      const center = new THREE.Vector3();
      this.collider.getCenter(center);
      this.colliderMesh.position.copy(center);
    }

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
      this.position = this.mesh.position.clone();
      this.lastCollisionCheck = Date.now();
      console.log("Starting collision with trash type:", this.type);
    }
  }

  resetCollision() {
    this.isCollidingWithPlayer = false;
    console.log("Resetting collision for trash type:", this.type);
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
      if (this.mesh.material) {
        if (Array.isArray(this.mesh.material)) {
          this.mesh.material.forEach(material => material.dispose());
        } else {
          this.mesh.material.dispose();
        }
      }
      this.mesh = null;
    }

    // Also remove the collider mesh
    if (this.colliderMesh && this.scene) {
      this.scene.remove(this.colliderMesh);
      if (this.colliderMesh.geometry) this.colliderMesh.geometry.dispose();
      if (this.colliderMesh.material) this.colliderMesh.material.dispose();
      this.colliderMesh = null;
    }

    this.collider = null;
  }
}

export default Trash;
