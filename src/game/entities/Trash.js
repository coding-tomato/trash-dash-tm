import * as THREE from "three";
import assetLoader from "../AssetLoader";
import { CONFIG } from "../../config";

class Trash {
  constructor(scene, type, position, onExpire) {
    this.scene = scene;
    this.type = type; // 'glass', 'metal_and_plastic', 'paper', or 'organic'
    this.selectedTrash = null;
    this.position = position;
    this.velocity = new THREE.Vector3(1, 0, 0);
    this.speed = 0.2;
    this.lifespan = 21000;
    this.createdAt = Date.now();
    this.mesh = null;
    this.isDestroyed = false; 
    this.modelName = this.selectRandomModel(type);
    this.highlightArrowMesh = null;
    this.onExpire = onExpire;

    // Active trash state
    this.isActive = false;

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
      paper: ["pizzaBox", "paper", "paperRoll"],
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
      case "paper":
        return "paper";
      default:
        return "sodaCan";
    }
  }

  createMesh() {
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
                  emissiveIntensity: 0,
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
                  emissiveIntensity: 0,
                });
                break;
              case "organic":
                material = new THREE.MeshStandardMaterial({
                  color: 0x8b4513, // Brown
                  roughness: 0.8,
                  metalness: 0.0,
                  emissive: 0x8b4513,
                  emissiveIntensity: 0,
                });
                break;
              case "paper":
                material = new THREE.MeshStandardMaterial({
                  color: 0x0a70df, // Blue
                  roughness: 0.5,
                  metalness: 0.0,
                  emissive: 0x0000ff,
                  emissiveIntensity: 0,
                });
                break;
              case "nonRecyclable":
                material = new THREE.MeshStandardMaterial({
                  color: 0xff0000, // Red
                  roughness: 0.5,
                  metalness: 0.1,
                  emissive: 0xff0000,
                  emissiveIntensity: 0,
                });
                break;
            }

            // Store the original material
            this.originalMaterials.push({
              mesh: child,
              material: material,
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

        // Add arrow mesh as a child (but hidden by default)
        this.highlightArrowMesh = this.createArrowMesh();
        if (this.mesh && this.highlightArrowMesh) {
          this.mesh.add(this.highlightArrowMesh);
        }

        return;
      }
    }
  }

  createArrowMesh() {
    // Create a simple down-facing pyramid as the arrow
    const pyramidGeometry = new THREE.ConeGeometry(0.2, 0.3, 4);
    const pyramidMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    pyramid.rotation.y = Math.PI / 4; // Align base to square
    pyramid.rotation.x = Math.PI; // Point downwards
    pyramid.position.y = 2;
    pyramid.scale.set(10, 10, 10);
    const arrowGroup = new THREE.Group();
    arrowGroup.add(pyramid);
    arrowGroup.visible = false;
    return arrowGroup;
  }

  update(deltaTime) {
    if (this.isDestroyed) return;

    // Handle spawn animation
    let currentScale = this.targetScale;

    if (this.isSpawning) {
      const elapsedTime = Date.now() - this.createdAt;
      const progress = Math.min(elapsedTime / this.spawnDuration, 1.0);

      // Use an easing function for smoother animation
      const easedProgress = this.easeOutBack(progress);
      currentScale =
        this.spawnScale + (this.targetScale - this.spawnScale) * easedProgress;

      if (this.mesh) {
        this.mesh.scale.set(currentScale, currentScale, currentScale);
      }

      if (progress >= 1.0) {
        this.isSpawning = false;
      }
    }

    // Move trash according to velocity and speed
    const movement = this.velocity
      .clone()
      .multiplyScalar(this.speed * deltaTime);
    this.mesh.position.add(movement);

    if (this.mesh && !this.isActive) {
      this.mesh.rotation.y += 0.001;
    }

    if (this.isActive) {
      this.mesh.rotation.y += 0.01;
    }

    this.updateGlowEffect(deltaTime);

    // Arrow highlight logic
    if (this.highlightArrowMesh) {
      if (this.isActive) {
        this.highlightArrowMesh.visible = true;
        // Position arrow above the mesh (account for scale)
        this.highlightArrowMesh.position.set(0, 20, 0);
        // Optional: animate arrow (e.g., bobbing)
        this.highlightArrowMesh.position.y += Math.sin(Date.now() * 0.005) * 0.8;
      } else {
        this.highlightArrowMesh.visible = false;
      }
    }

    // Check if trash should be destroyed (after lifespan)
    if (Date.now() - this.createdAt >= this.lifespan) {
      this.onExpire && this.onExpire();
    }
  }

  // Easing function for smoother animation
  easeOutBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  selectTrash() {
    if (!this.isActive) {
      this.isActive = true;
      this.position = this.mesh.position.clone();
      this.glowIntensity = 0;
    }
  }

  updateGlowEffect(deltaTime) {
    if (this.isActive) {
      this.glowIntensity =
        (Math.sin(Date.now() * this.glowPulseSpeed) * 0.5 + 0.8) *
        this.maxGlowIntensity;
    } else {
      this.glowIntensity = Math.max(
        0,
        this.glowIntensity - deltaTime * this.glowSpeed
      );
    }

    // Apply the glow intensity to all materials
    for (const item of this.originalMaterials) {
      if (item.mesh && item.mesh.material) {
        item.mesh.material.emissiveIntensity = this.glowIntensity;
      }
    }
  }

  checkCombination(inputCombo) {
    // Return false if not currently active
    if (!this.isActive) {
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

  getTrashType() {
    return this.type;
  }

  destroy() {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;

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

    if (this.highlightArrowMesh && this.mesh) {
      this.mesh.remove(this.highlightArrowMesh);
      this.highlightArrowMesh = null;
    }

    this.originalMaterials = [];
  }
}

export default Trash;
