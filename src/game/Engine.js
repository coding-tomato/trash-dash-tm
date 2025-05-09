import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Player from "./entities/Player";
import Scenario from "./Scenario";
import Input from "./Input";
import TrashSpawner from "./entities/TrashSpawner";
import Stats from "./Stats";

class Engine {
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
    
    this.cameraConfig = {
      initialPosition: new THREE.Vector3(0, 5, 10),
      lookAt: new THREE.Vector3(0, 0, 0),
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

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // Smooth camera movement
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = this.cameraConfig.minDistance;
    this.controls.maxDistance = this.cameraConfig.maxDistance;
    
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

    window.addEventListener("resize", this.handleResize.bind(this));

    this.isInitialized = true;

    this.animate();
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

    this.updateReactState();

    this.renderer.render(this.scene, this.camera);
  }

  processInput() {
    // This method is kept for future input handling not related to camera movement
    if (!this.controlsEnabled || !this.input) return;
    
    const keys = this.input.getState();
    // You can still use this for non-movement related inputs
  }

  updateReactState() {
    if (this.player) {
      const playerState = this.player.getGameState();
      if (playerState.score !== this.stats.score) {
        this.stats.score = playerState.score;
        this.emitEvent("stateChange", this.stats.getState());
      }
    }
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

  updateGameState(newState) {
    // Update stats from newState
    if (typeof newState.score !== 'undefined') this.stats.score = newState.score;
    if (typeof newState.level !== 'undefined') this.stats.level = newState.level;
    if (typeof newState.isPlaying !== 'undefined') this.stats.isPlaying = newState.isPlaying;
    if (typeof newState.collisionsCount !== 'undefined') this.stats.collisionsCount = newState.collisionsCount;
    this.emitEvent("stateChange", this.stats.getState());
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
    if (this.player) {
      const playerState = this.player.getGameState();
      this.stats.score = playerState.score;
    }
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
    
    // If we already have an active collision, only check that one
    if (this.trashSpawner.activeCollisionIndex !== null) {
      const activeTrash = this.trashSpawner.trashItems[this.trashSpawner.activeCollisionIndex];
      
      // Check if player is still colliding with the active trash
      if (activeTrash && this.player.checkCollision(activeTrash)) {
        // Keep the active collision state
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
        
        // Only process the first collision
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
        if (activeTrash.type === "plastic") {
          scoreToAdd = 20;
        } else if (activeTrash.type === "glass") {
          scoreToAdd = 30;
        }

        this.stats.addScore(scoreToAdd);
        if (this.player) this.player.addScore(scoreToAdd);
        
        const trashType = activeTrash.type;
        activeTrash.destroy();
        
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
      }
    }
  }
  
  /**
   * Enable or disable collision detection
   * @param {boolean} enabled - Whether collisions should be enabled
   */
  setCollisionsEnabled(enabled) {
    this.collisionsEnabled = enabled;
  }
}

export default Engine;
