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

    // Add audio properties
    this.audioListener = null;
    this.sounds = {
      music: null,
      good: null,
      bad: null,
      spawn: null,
    };

    this.cameraConfig = {
      initialPosition: new THREE.Vector3(0, 2, 2),
      lookAt: new THREE.Vector3(0, 1.2, 0),
      minDistance: 2,
      maxDistance: 30,
    };

    this.gameObjects = [];
    this.eventListeners = {};
    this.controlsEnabled = true;
    this.input = null;
    this.trashSpawner = null;
    this.collisionsEnabled = true;
    this.keyCombo = [];
  }

  setPlayerCharacter(index) {
    if (this.player) {
      this.player.setCharacter(index);
    }
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

    // Add orbit controls if in debug mode
    if (CONFIG.DEBUG) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.target.copy(this.cameraConfig.lookAt);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.minDistance = this.cameraConfig.minDistance;
      this.controls.maxDistance = this.cameraConfig.maxDistance;
    }

    // Initialize audio
    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);
    this.loadSounds();

    // Start pre-loading assets
    this.preloadAssets().then(() => {
      this.setupGameObjects();
      this.startIntroAnimation().then(() => {
        this.animate();
      });
    });

    window.addEventListener("resize", this.handleResize.bind(this));
    this.isInitialized = true;
  }

  // Start intro camera animation
  startIntroAnimation() {
    return new Promise((resolve) => {
      // Set camera to an offset position for animation
      const startPosition = new THREE.Vector3(
        this.cameraConfig.initialPosition.x + 5,
        this.cameraConfig.initialPosition.y + 2,
        this.cameraConfig.initialPosition.z + 3
      );

      this.camera.position.copy(startPosition);

      // Animation duration in milliseconds
      const duration = 2000;
      const startTime = Date.now();
      const endPosition = this.cameraConfig.initialPosition.clone();

      // Animation function
      const animateCamera = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Use an easing function for smoother animation
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOutCubic(progress);

        // Interpolate between start and end positions
        const newPosition = new THREE.Vector3().lerpVectors(
          startPosition,
          endPosition,
          easedProgress
        );

        this.camera.position.copy(newPosition);
        this.camera.lookAt(this.cameraConfig.lookAt);

        // Render the scene to show the animation
        this.renderer.render(this.scene, this.camera);

        if (progress < 1) {
          requestAnimationFrame(animateCamera);
        } else {
          resolve(); // Animation complete
        }
      };

      // Start animation
      animateCamera();
    });
  }

  // Add method to load sounds
  loadSounds() {
    // Set up music (will be loaded by AssetLoader)
    this.sounds.music = new THREE.Audio(this.audioListener);
    this.sounds.music.setLoop(true);
    this.sounds.music.setVolume(0.3);

    // Set up sound effects (will be loaded by AssetLoader)
    this.sounds.good = new THREE.Audio(this.audioListener);
    this.sounds.good.setVolume(0.5);

    this.sounds.bad = new THREE.Audio(this.audioListener);
    this.sounds.bad.setVolume(0.5);

    this.sounds.spawn = new THREE.Audio(this.audioListener);
    this.sounds.spawn.setVolume(0.4);
  }

  // Play a sound effect
  playSound(soundName) {
    const sound = this.sounds[soundName];
    if (sound && sound.buffer) {
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.play();
    }
  }

  preloadAssets() {
    // Show loading status
    this.emitEvent("loadingAssets", { loading: true });

    return assetLoader
      .preloadAssets()
      .then(() => {
        this.assetsLoaded = true;
        this.setupAudio();
        this.emitEvent("loadingAssets", { loading: false });
      })
      .catch((error) => {
        console.error("Error loading assets:", error);
        this.emitEvent("loadingAssets", { loading: false, error: true });
      });
  }

  // Set up audio with loaded buffers from AssetLoader
  setupAudio() {
    if (assetLoader.isLoaded) {
      // Set up music
      const musicBuffer = assetLoader.getAudio("music");
      if (musicBuffer) {
        this.sounds.music.setBuffer(musicBuffer);
      }

      // Set up sound effects
      const goodBuffer = assetLoader.getAudio("goodSound");
      if (goodBuffer) {
        this.sounds.good.setBuffer(goodBuffer);
      }

      const badBuffer = assetLoader.getAudio("badSound");
      if (badBuffer) {
        this.sounds.bad.setBuffer(badBuffer);
      }

      const spawnBuffer = assetLoader.getAudio("spawn");
      if (spawnBuffer) {
        this.sounds.spawn.setBuffer(spawnBuffer);
      }

      // Start playing background music
      if (this.sounds.music.buffer) {
        this.sounds.music.play();
      }
    }
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
      height: 15,
    });
    // Set up spawn sound callback
    this.trashSpawner.onSpawn = (trashType) => {
      this.playSound("spawn");
    };
    this.gameObjects.push({
      id: "trashSpawner",
      type: "environment",
      object: this.trashSpawner,
      update: (delta) => this.trashSpawner.update(delta),
    });

    this.input = new Input({
      onPause: () => {
        // Directly handle pause/resume toggle when Escape key is pressed
        this.handlePauseRequest();
      },
      onKeyCombo: (combo) => this.handleKeyCombo(combo),
    });
    this.input.attach();
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    // Calculate delta time
    const now = Date.now();
    const delta = now - (this.lastUpdate || now);
    this.lastUpdate = now;

    // Update orbit controls (for damping) if they exist
    if (this.controls && CONFIG.DEBUG) {
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

  // Add a method to handle pause requests that can toggle between pause/resume
  handlePauseRequest() {
    if (!this.isInitialized) return;

    // If currently playing, pause the game. Otherwise, resume it.
    if (this.animationId) {
      this.pause();
    } else {
      this.resume();
    }
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

    // Pause background music
    this.pauseMusic();

    // Update game state
    this.stats.setPlaying(false);

    // First notify listeners that game is paused (before state update)
    this.emitEvent("gamePaused", {});

    // Then update the React state
    this.updateReactState();
    this.clearGameTimer(); // Stop the timer on pause
  }

  resume() {
    // First check conditions for validity
    if (!this.isInitialized) {
      return;
    }

    if (this.animationId) {
      return;
    }

    this.controlsEnabled = true;
    this.lastUpdate = Date.now(); // Reset last update time

    // Resume background music
    this.playMusic();

    // Update game state
    this.stats.setPlaying(true);

    // First notify listeners that game is being resumed (before animation starts)
    this.emitEvent("gameResumed", {});

    // Then update the React state
    this.updateReactState();

    // Start animation loop
    this.animate();

    this.startGameTimer(); // Start the 3-minute timer
  }

  getGameState() {
    return this.stats.getState();
  }

  resetCamera(animate = false) {
    if (!this.camera) return;

    if (animate) {
      return this.startIntroAnimation();
    } else {
      this.camera.position.copy(this.cameraConfig.initialPosition);
      if (this.controls) {
        this.controls.target.copy(this.cameraConfig.lookAt);
        this.controls.update();
      }
      return Promise.resolve();
    }
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
    this.eventListeners[event] = this.eventListeners[event].filter(
      (cb) => cb !== callback
    );
  }

  emitEvent(event, data) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event].forEach((callback) => callback(data));
  }

  destroy() {
    if (!this.isInitialized) return;

    // Stop and clean up audio
    Object.values(this.sounds).forEach((sound) => {
      if (sound && sound.isPlaying) {
        sound.stop();
      }
    });

    // Explicitly ensure background music is stopped
    this.stopMusic();

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
    if (!trashItems.length) return;

    // Always use the first trash as the active one
    const activeTrash = trashItems[0];
    // Check if player is close enough to the first trash
    if (this.player.checkCollision(activeTrash)) {
      if (!activeTrash.isCollidingWithPlayer) {
        activeTrash.startCollision();
        this.stats.incrementCollisions();
        this.emitEvent("collision", {
          type: activeTrash.getCollisionType(),
          count: this.stats.collisionsCount,
          requiredCombo: activeTrash.requiredCombination,
          isNonRecyclable: activeTrash.getCollisionType() === "nonRecyclable",
          modelName: activeTrash.modelName,
        });
      }
    } else {
      if (activeTrash.isCollidingWithPlayer) {
        activeTrash.resetCollision();
      }
    }
  }

  handleKeyCombo(combo) {
    this.keyCombo = combo;
    this.emitEvent("keyCombo", combo);

    // Only allow disposal for the first trash item
    if (this.trashSpawner && this.trashSpawner.trashItems.length > 0) {
      const activeTrash = this.trashSpawner.trashItems[0];
      if (!activeTrash) return;

      // Check if this trash can be disposed with the current combo
      const isCorrectCombo = activeTrash.checkCombination(combo);

      if (this.input.getCombo().length > 3 && !isCorrectCombo) {
        this.input.resetCombo();
        this.emitEvent("keyCombo", []);
        this.playSound("bad");
        this.stats.addScore(-10);
        this.updateReactState();
      }

      if (isCorrectCombo) {
        this.playSound("good");
        this.stats.addScore(10);
        const trashType = activeTrash.type;

        // Reset the collision state first
        activeTrash.resetCollision();

        // Destroy the trash object
        activeTrash.destroy();

        // Player jump animation
        this.player.jump();

        // Remove from array
        this.trashSpawner.trashItems.splice(0, 1);

        // Filter out any destroyed items that may have been missed
        this.trashSpawner.trashItems = this.trashSpawner.trashItems.filter(
          (trash) => trash && !trash.isDestroyed
        );

        // Reset the input queue after successful disposal
        if (this.input) {
          this.input.resetCombo();
        }

        // Notify about successful disposal
        this.emitEvent("trashDisposed", {
          type: trashType,
          score: this.stats.score,
        });
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
      const playerIndex = this.gameObjects.findIndex(
        (obj) => obj.id === "player"
      );
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
        height: 15,
      });
      // Reset spawn sound callback
      this.trashSpawner.onSpawn = (trashType) => {
        this.playSound("spawn");
      };

      // Update the trashSpawner reference in gameObjects
      const trashIndex = this.gameObjects.findIndex(
        (obj) => obj.id === "trashSpawner"
      );
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
      this.emitEvent("keyCombo", []); // Emit empty key combo to update the UI
    }

    // Notify about game reset
    this.emitEvent("gameReset", this.stats.getState());

    // Pause the game
    this.pause();
    this.clearGameTimer();
  }

  startGameTimer() {
    // End the game after 3 minutes (180000 ms)
    if (this._gameTimer) clearTimeout(this._gameTimer);
    this._gameTimer = setTimeout(() => {
      this.setCurrentScene(CONFIG.SCENES.SCORE_SCREEN);
      this.pause();
    }, 180000);
  }

  clearGameTimer() {
    if (this._gameTimer) {
      clearTimeout(this._gameTimer);
      this._gameTimer = null;
    }
  }

  // Play background music
  playMusic() {
    if (
      this.sounds.music &&
      this.sounds.music.buffer &&
      !this.sounds.music.isPlaying
    ) {
      this.sounds.music.play();
    }
  }

  // Pause background music
  pauseMusic() {
    if (this.sounds.music && this.sounds.music.isPlaying) {
      this.sounds.music.pause();
    }
  }

  // Stop background music
  stopMusic() {
    if (this.sounds.music && this.sounds.music.isPlaying) {
      this.sounds.music.stop();
    }
  }
}

export default Game;
