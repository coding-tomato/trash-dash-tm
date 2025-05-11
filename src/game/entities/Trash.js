import * as THREE from "three";
import assetLoader from "../AssetLoader";
import { CONFIG } from "../../config";

class Trash {
  constructor(scene, type, position) {
    this.scene = scene;
    this.type = type; // 'glass', 'metal_and_plastic', 'paper', or 'organic'
    this.selectedTrash = null;
    this.position = position;
    this.velocity = new THREE.Vector3(1, 0, 0);
    this.speed = 0.2;
    this.lifespan = 23000;
    this.createdAt = Date.now();
    this.mesh = null;
    this.collider = null;
    this.colliderMesh = null; // Add property for collider visualization
    this.isDestroyed = false; // Flag to indicate whether destroy() has been called
    this.modelName = this.selectRandomModel(type);

    // Collision state
    this.isCollidingWithPlayer = false;
    this.maxCollisionDistance = 5; // Maximum distance to player to maintain collision
    this.lastCollisionCheck = Date.now(); // Add a timestamp to track collisions
    this.collisionTimeout = 15000;
    
    // Glow effect properties
    this.glowIntensity = 0;
    this.maxGlowIntensity = 1.0; // Increased intensity for internal glow only
    this.glowSpeed = 2.0;
    this.glowPulseSpeed = 0.005; // Controls how fast the glow pulses
    this.originalMaterials = []; // Store original materials for reverting

    // Define key combinations required for disposal based on trash type
    this.requiredCombination = this.getRequiredCombination();
    
    // Animation properties for spawning
    this.isSpawning = true;
    this.spawnDuration = 1000; // 1 second for the spawn animation
    this.spawnScale = 0.01; // Start very small
    this.targetScale = 0.04; // Target full size

    this.createMesh();
    this.createCollider();
    
    // Apply initial scale for spawn animation
    if (this.mesh) {
      this.mesh.scale.set(this.spawnScale, this.spawnScale, this.spawnScale);
    }
  }

  getRequiredCombination() {
    return (
      CONFIG.TRASH_COMBINATIONS[this.type] ||
      CONFIG.TRASH_COMBINATIONS.nonRecyclable
    );
  }

  selectRandomModel(type) {
    // Models categorized by type
    const models = {
      glass: ["botellaVino", "botellin", "copaRota", "botellaLicor"],
      metal_and_plastic: ["botellaPlastico", "bolsa", "sodaCan", "lataAtun"],
      organic: [
        "bananaPeel",
        "manzana",
        "musloPollo",
        "pizzaSlice",
        "eggShell",
      ],
      nonRecyclable: ["jeringuilla", "bateria", "movil"],
    };

    // Pick a random model from the appropriate category
    if (models[type] && models[type].length > 0) {
      const randomIndex = Math.floor(Math.random() * models[type].length);
      const model = models[type][randomIndex];
      this.modelName = model;
      return model;
    }

    // Fallbacks if no models are found
    switch (type) {
      case "glass":
        return "botellaVino";
      case "metal_and_plastic":
        return "botellaPlastico";
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
            let material;
            
            switch (this.type) {
              case "glass":
                material = new THREE.MeshPhysicalMaterial({
                  color: 0x98b253, // Green
                  transparent: true,
                  opacity: 0.8,
                  roughness: 0.1,
                  metalness: 0,
                  transmission: 0.5,
                  clearcoat: 1.0,
                  emissive: 0x98b253,
                  emissiveIntensity: 0
                });
                break;
              case "metal_and_plastic":
                material = new THREE.MeshStandardMaterial({
                  color: 0xffff00, // Yellow
                  transparent: true,
                  opacity: 0.9,
                  roughness: 0.5,
                  metalness: 0.8,
                  emissive: 0xffff00,
                  emissiveIntensity: 0
                });
                break;
              case "organic":
                material = new THREE.MeshStandardMaterial({
                  color: 0x8b4513, // Brown
                  roughness: 0.8,
                  metalness: 0.0,
                  emissive: 0x8b4513,
                  emissiveIntensity: 0
                });
                break;
              case "paper":
                material = new THREE.MeshStandardMaterial({
                  color: 0x0000ff, // Blue
                  roughness: 0.5,
                  metalness: 0.0,
                  emissive: 0x0000ff,
                  emissiveIntensity: 0
                });
                break;
              case "nonRecyclable":
                material = new THREE.MeshStandardMaterial({
                  color: 0xff0000, // Red
                  roughness: 0.5,
                  metalness: 0.1,
                  emissive: 0xff0000,
                  emissiveIntensity: 0
                });
                break;
            }
            
            // Store the original material
            this.originalMaterials.push({
              mesh: child,
              material: material
            });
            
            child.material = material;
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
          emissive: 0x88ccff,
          emissiveIntensity: 0
        });
        break;
      case "metal_and_plastic":
        geometry = new THREE.SphereGeometry(1, 16, 16);
        material = new THREE.MeshStandardMaterial({
          color: 0xffcc99,
          transparent: true,
          opacity: 0.9,
          roughness: 0.5,
          emissive: 0xffcc99,
          emissiveIntensity: 0
        });
        break;
      case "organic":
        geometry = new THREE.TorusGeometry(0.8, 0.4, 16, 32);
        material = new THREE.MeshStandardMaterial({
          color: 0x99cc66,
          roughness: 0.8,
          emissive: 0x99cc66,
          emissiveIntensity: 0
        });
        break;
      case "nonRecyclable":
        geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
        material = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          roughness: 0.5,
          emissive: 0xff0000,
          emissiveIntensity: 0
        });
        break;
      default:
        geometry = new THREE.SphereGeometry(1, 16, 16);
        material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 0
        });
    }

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
    
    // Store the original material for fallback geometry
    this.originalMaterials.push({
      mesh: this.mesh,
      material: material
    });
  }

  createCollider() {
    // Initial size (will be scaled during the spawning animation)
    const size = new THREE.Vector3(2, 2, 2);
    const center = this.position.clone();
    
    // Create collider with initial size
    const initialSize = size.clone().multiplyScalar(this.spawnScale);
    this.collider = new THREE.Box3(
      center.clone().sub(initialSize.clone().multiplyScalar(0.5)),
      center.clone().add(initialSize.clone().multiplyScalar(0.5))
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
    // Apply initial scale
    this.colliderMesh.scale.set(this.spawnScale, this.spawnScale, this.spawnScale);
    this.colliderMesh.visible = CONFIG.DEBUG; // Only show in debug mode
    this.scene.add(this.colliderMesh);
  }

  update(deltaTime) {
    // Handle spawn animation
    let currentScale = this.targetScale;
    
    if (this.isSpawning) {
      const elapsedTime = Date.now() - this.createdAt;
      const progress = Math.min(elapsedTime / this.spawnDuration, 1.0);
      
      // Use an easing function for smoother animation
      const easedProgress = this.easeOutBack(progress);
      currentScale = this.spawnScale + (this.targetScale - this.spawnScale) * easedProgress;
      
      if (this.mesh) {
        this.mesh.scale.set(currentScale, currentScale, currentScale);
      }
      
      if (progress >= 1.0) {
        this.isSpawning = false;
      }
    }

    // Always move trash according to velocity and speed, regardless of collision state
    const movement = this.velocity
      .clone()
      .multiplyScalar(this.speed * deltaTime);
    this.mesh.position.add(movement);

    // Make the trash spin slightly all the time
    if (this.mesh && !this.isCollidingWithPlayer) {
      this.mesh.rotation.y += 0.001;
    }

    // If colliding, add visual effect but don't stop movement
    if (this.isCollidingWithPlayer) {
      this.mesh.rotation.y += 0.01;

      // Check if collision has timed out (safety mechanism)
      if (Date.now() - this.lastCollisionCheck > this.collisionTimeout) {
        this.resetCollision();
      }

      // Check if trash has moved too far from player (opportunity window closed)
      // We'll use the original fixed position as a reference point
      const playerPosition = new THREE.Vector3(0, 1, -1); // Player's typical position
      if (
        this.mesh.position.distanceTo(playerPosition) >
        this.maxCollisionDistance
      ) {
        this.resetCollision();
      }
    }
    
    // Update glow effect regardless of collision state to handle transitions
    this.updateGlowEffect(deltaTime);

    // Update collider position and scale
    const size = new THREE.Vector3(2, 2, 2).multiplyScalar(currentScale);
    this.collider.min.copy(
      this.mesh.position.clone().sub(size.clone().multiplyScalar(0.5))
    );
    this.collider.max.copy(
      this.mesh.position.clone().add(size.clone().multiplyScalar(0.5))
    );

    // Update the wireframe collider visualization position and scale
    if (this.colliderMesh) {
      // Calculate center of the collider box
      const center = new THREE.Vector3();
      this.collider.getCenter(center);
      this.colliderMesh.position.copy(center);
      
      // Update the scale of the collider mesh
      this.colliderMesh.scale.set(currentScale, currentScale, currentScale);
    }

    // Check if trash should be destroyed (after lifespan)
    if (Date.now() - this.createdAt >= this.lifespan) {
      this.destroy();
      return false; // Signal that this object should be removed
    }
    
    // Check if the object has been marked for deletion
    if (this.isDestroyed) {
      return false; // Signal that this object should be removed
    }

    return true; // Object still active
  }
  
  // Easing function for smoother animation
  easeOutBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  startCollision() {
    if (!this.isCollidingWithPlayer) {
      this.isCollidingWithPlayer = true;
      this.position = this.mesh.position.clone();
      this.lastCollisionCheck = Date.now();
      // Reset glow intensity for smooth animation start
      this.glowIntensity = 0;
    }
  }

  resetCollision() {
    this.isCollidingWithPlayer = false;
    // Remove glow effect immediately
    this.glowIntensity = 0;
    this.updateGlowEffect(0);
  }
  
  // Apply glow effect based on current intensity
  updateGlowEffect(deltaTime) {
    // Update glow intensity if colliding
    if (this.isCollidingWithPlayer) {
      // Create a more dramatic pulsing effect with a sin wave
      this.glowIntensity = (Math.sin(Date.now() * this.glowPulseSpeed) * 0.5 + 0.8) * this.maxGlowIntensity;
    } else {
      // Gradually decrease glow if not colliding
      this.glowIntensity = Math.max(0, this.glowIntensity - deltaTime * this.glowSpeed);
    }
    
    // Apply the glow intensity to all materials
    for (const item of this.originalMaterials) {
      if (item.mesh && item.mesh.material) {
        item.mesh.material.emissiveIntensity = this.glowIntensity;
      }
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
    // Prevent double destruction
    if (this.isDestroyed) {
      return;
    }
    
    // Mark as destroyed
    this.isDestroyed = true;
    
    // Remove the mesh from the scene and dispose of resources
    if (this.mesh && this.scene) {
      this.scene.remove(this.mesh);
      if (this.mesh.geometry) this.mesh.geometry.dispose();
      if (this.mesh.material) {
        if (Array.isArray(this.mesh.material)) {
          this.mesh.material.forEach((material) => material.dispose());
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
    this.originalMaterials = [];
  }
}

export default Trash;
