import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Player from "./entities/Player";
import Scenario from "./Scenario";
import Input from "./Input";
import TrashSpawner from "./entities/TrashSpawner";
import Stats from "./Stats";
import { CONFIG } from "../config";
import assetLoader from "./AssetLoader";

class Game {
  constructor(containerId) {
    this.containerId = containerId;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null; 
    this.player = null;
    this.isInitialized = false;
    this.animationId = null;
    this.stats = new Stats();
    this.assetsLoaded = false;
    
    this.cameraConfig = {
      initialPosition: new THREE.Vector3(0, 3, 4),
      lookAt: new THREE.Vector3(0, 2, 0),
      minDistance: 2,
      maxDistance: 30
    };

    this.gameObjects = [];
    this.eventListeners = {};
    this.controlsEnabled = true;
    this.input = null;
    this.trashSpawner = null;
    this.collisionsEnabled = true;
    this.keyCombo = [];
  }

  init() {
    if (this.isInitialized) return;

    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with id "${this.containerId}" not found`);
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111122);

    // Camera 
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.copy(this.cameraConfig.initialPosition);
    this.camera.lookAt(this.cameraConfig.lookAt);

    // Render
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Start pre-loading assets
    this.preloadAssets().then(() => {
      this.setupGameObjects();
      this.animate();
    });

    window.addEventListener("resize", this.handleResize.bind(this));
    this.isInitialized = true;
  }

  preloadAssets() {
    // Show loading status
    this.emitEvent("loadingAssets", { loading: true });

    return assetLoader.preloadAssets()
      .then(() => {
        this.assetsLoaded = true;
        this.emitEvent("loadingAssets", { loading: false });
        console.log("Assets loaded successfully");
      })
      .catch(error => {
        console.error("Error loading assets:", error);
        this.emitEvent("loadingAssets", { loading: false, error: true });
      });
  }

  setupGameObjects() {
    this.player = new Player(this.scene);
    this.gameObjects.push({
      id: "player",
      type: "player",
      object: this.player,
      update: (delta) => this.player.update(delta),
    });

    this.scenario = new Scenario(this.scene);

    this.trashSpawner = new TrashSpawner(this.scene, {
      width: 30,
      depth: 30,
      height: 15
    });
    this.gameObjects.push({
      id: "trashSpawner",
      type: "environment",
      object: this.trashSpawner,
      update: (delta) => this.trashSpawner.update(delta),
    });

    this.input = new Input({
      onPause: () => this.emitEvent("requestPause", {}),
      onKeyCombo: (combo) => this.handleKeyCombo(combo)
    });
    this.input.attach();
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    // Calculate delta time
    const now = Date.now();
    const delta = now - (this.lastUpdate || now);
    this.lastUpdate = now;

    // Update orbit controls (for damping)
    if (this.controls) {
      this.controls.update();
    }

    this.gameObjects.forEach((obj) => {
      if (obj.update) {
        obj.update(delta / 1000); // Convert to seconds
      }
    });

    if (this.collisionsEnabled && this.player && this.trashSpawner) {
      this.checkCollisions();
    }


    this.renderer.render(this.scene, this.camera);
  }

  processInput() {
    // This method is kept for future input handling not related to camera movement
    if (!this.controlsEnabled || !this.input) return;
    
    const keys = this.input.getState();
    // You can still use this for non-movement related inputs
  }

  setCurrentScene(scene) {
    if (!this.isInitialized) return;
    this.stats.setCurrentScene(scene);
    this.updateReactState();
  }

  updateReactState() {
    this.emitEvent("stateChange", this.stats.getState());
  }

  handleResize() {
    if (!this.isInitialized) return;

    const container = document.getElementById(this.containerId);
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  addObject(object) {
    this.scene.add(object.mesh);
    this.gameObjects.push(object);
    return object;
  }

  removeObject(objectId) {
    const index = this.gameObjects.findIndex((obj) => obj.id === objectId);
    if (index !== -1) {
      const object = this.gameObjects[index];
      this.scene.remove(object.mesh);
      this.gameObjects.splice(index, 1);
    }
  }

  pause() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Disable controls while paused
    this.controlsEnabled = false;
    
    // Notify listeners that game is paused
    this.emitEvent("gamePaused", {});
  }

  resume() {
    if (!this.isInitialized || this.animationId) return;
    
    this.controlsEnabled = true;
    this.lastUpdate = Date.now(); // Reset last update time
    this.animate();
    
    // Notify listeners that game is resumed
    this.emitEvent("gameResumed", {});
  }

  getGameState() {
    return this.stats.getState();
  }

  resetCamera() {
    if (!this.camera || !this.controls) return;
    
    this.camera.position.copy(this.cameraConfig.initialPosition);
    this.controls.target.copy(this.cameraConfig.lookAt);
    this.controls.update();
  }
  
  focusCamera(position) {
    if (!this.controls) return;
    
    this.controls.target.copy(position);
    this.controls.update();
  }

  // Event handling system for communication with React
  addEventListener(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event].filter(
      (cb) => cb !== callback
    );
  }

  emitEvent(event, data) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event].forEach((callback) => callback(data));
  }

  destroy() {
    if (!this.isInitialized) return;

    // Stop animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Remove event listeners
    window.removeEventListener("resize", this.handleResize);

    // Remove input event listeners
    if (this.input) this.input.detach();
    
    // Dispose of OrbitControls
    if (this.controls) {
      this.controls.dispose();
    }

    // Clean up trash spawner
    if (this.trashSpawner) {
      this.trashSpawner.destroy();
    }

    // Dispose of Three.js resources
    this.gameObjects.forEach((obj) => {
      if (obj.object && obj.object.destroy) {
        obj.object.destroy(this.scene);
      } else if (obj.mesh) {
        if (obj.mesh.geometry) obj.mesh.geometry.dispose();
        if (obj.mesh.material) {
          if (Array.isArray(obj.mesh.material)) {
            obj.mesh.material.forEach((material) => material.dispose());
          } else {
            obj.mesh.material.dispose();
          }
        }
      }
    });

    // Remove renderer from DOM
    const container = document.getElementById(this.containerId);
    if (container && this.renderer) {
      container.removeChild(this.renderer.domElement);
    }

    this.isInitialized = false;
  }

  checkCollisions() {
    const trashItems = this.trashSpawner.getTrashItems();
    
    if (this.trashSpawner.activeCollisionIndex !== null) {
      const activeTrash = this.trashSpawner.trashItems[this.trashSpawner.activeCollisionIndex];
      
      if (activeTrash && this.player.checkCollision(activeTrash)) {
        return;
      } else if (activeTrash) {
        // Reset the collision if player is no longer colliding with it
        activeTrash.resetCollision();
        this.trashSpawner.activeCollisionIndex = null;
      } else {
        // If the activeTrash no longer exists, reset activeCollision
        this.trashSpawner.activeCollisionIndex = null;
      }
    }
    
    // Find the first trash that collides with the player
    for (let i = 0; i < trashItems.length; i++) {
      const trash = trashItems[i];
      
      // If player is colliding with this trash and we don't have an active collision yet
      if (this.player.checkCollision(trash) && this.trashSpawner.activeCollisionIndex === null) {
        // Start collision and set as active
        trash.startCollision();
        this.trashSpawner.activeCollisionIndex = i;
        this.stats.incrementCollisions();
        this.emitEvent("collision", { 
          type: trash.getCollisionType(),
          count: this.stats.collisionsCount,
          requiredCombo: trash.requiredCombination
        });
        
        break;
      }
    }
  }

  handleKeyCombo(combo) {
    this.keyCombo = combo;
    
    // Check for trash disposal - but only for the active collision
    if (this.trashSpawner && this.trashSpawner.activeCollisionIndex !== null) {
      const activeTrash = this.trashSpawner.trashItems[this.trashSpawner.activeCollisionIndex];
      
      // Check if this trash can be disposed with the current combo
      if (activeTrash && activeTrash.checkCombination(combo)) {
        let scoreToAdd = 0;

        // Different scores for different trash types
        switch(activeTrash.type) {
          case "glass":
            scoreToAdd = 10;
            break;
          case "plastic": 
            scoreToAdd = 10;
            break;
          case "metal":
            scoreToAdd = 15;
            break;
          case "organic":
            scoreToAdd = 5;
            break;
          case "nonRecyclable":
            scoreToAdd = -20;
            break;
          default:
            scoreToAdd = 5;
        }

        this.stats.addScore(scoreToAdd);

        const trashType = activeTrash.type;
        
        activeTrash.destroy();
        this.player.jump();
        
        // Remove from array
        this.trashSpawner.trashItems.splice(this.trashSpawner.activeCollisionIndex, 1);
        
        // Clear the active collision so the next item can be processed
        this.trashSpawner.activeCollisionIndex = null;
        
        // Reset the input queue after successful disposal
        if (this.input) {
          this.input.resetCombo();
        }
        
        // Notify about successful disposal
        this.emitEvent("trashDisposed", { 
          type: trashType,
          score: this.stats.score
        });

        if (
          this.stats.score >= CONFIG.LEVELS_CONFIG[this.stats.level].SCORE_TO_BEAT
        ) {
          if (this.stats.level === CONFIG.LEVELS_CONFIG.length - 1) {
            this.setCurrentScene(CONFIG.SCENES.SCORE_SCREEN);
            this.pause();
          }
          else {
            this.stats.setLevel(this.stats.level + 1);
            this.stats.score = 0;
            this.emitEvent("levelUp", this.stats.level);
          }
        }

        this.updateReactState();
      }
    }
  }
  
  setCollisionsEnabled(enabled) {
    this.collisionsEnabled = enabled;
  }

  resetGame() {
    if (!this.isInitialized) return;

    // Reset player position and score
    if (this.player) {
      // Destroy and recreate the player to reset its state
      this.player.destroy(this.scene);
      this.player = new Player(this.scene);
      
      // Update the player reference in gameObjects
      const playerIndex = this.gameObjects.findIndex(obj => obj.id === "player");
      if (playerIndex !== -1) {
        this.gameObjects[playerIndex] = {
          id: "player",
          type: "player",
          object: this.player,
          update: (delta) => this.player.update(delta), // Add the update function for the player
        };
      }
    }

    // Clear all trash items
    if (this.trashSpawner) {
      this.trashSpawner.destroy();
      this.trashSpawner = new TrashSpawner(this.scene, { 
        width: 30, 
        depth: 30, 
        height: 15 
      });
      
      // Update the trashSpawner reference in gameObjects
      const trashIndex = this.gameObjects.findIndex(obj => obj.id === "trashSpawner");
      if (trashIndex !== -1) {
        this.gameObjects[trashIndex] = {
          id: "trashSpawner",
          type: "environment",
          object: this.trashSpawner,
          update: (delta) => this.trashSpawner.update(delta),
        };
      }
    }

    // Reset the stats
    this.stats.reset();
    
    // Reset key combinations
    if (this.input) {
      this.input.resetCombo();
    }
    
    // Notify about game reset
    this.emitEvent("gameReset", this.stats.getState());
    
    // Pause the game
    this.pause();
  }
}

export default Game;
