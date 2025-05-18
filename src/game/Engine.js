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
    this.keyCombo = [];
    this.trashNotified = false;
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

    window.addEventListener("resize", this.handleResize.bind(this));

    // Set initialized flag early so other methods like handleResize will work
    this.isInitialized = true;

    this.input = new Input({
      onPause: () => this.handlePauseRequest(),
      onKeyCombo: (combo) => this.handleKeyCombo(combo),
    });
    this.input.attach();

    // Start pre-loading assets
    this.preloadAssets().then(() => {
      this.setupGameObjects();
      this.startIntroAnimation().then(() => {
        this.update();
      });
    });
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

  playSound(soundName) {
    const sound = this.sounds[soundName];
    if (sound && sound.buffer) {
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.play();
    }
  }

  async preloadAssets() {
    this.emitEvent("loadingAssets", { loading: true });

    try {
      await assetLoader.preloadAssets();
      this.assetsLoaded = true;
      this.loadAndSetupAudio();
      this.emitEvent("loadingAssets", { loading: false });
    } catch (error) {
      console.error("Error loading assets:", error);
      this.emitEvent("loadingAssets", { loading: false, error: true });
    }
  }

  loadAndSetupAudio() {
    // Create audio objects with their settings
    // and setup their buffers from AssetLoader
    try {
      if (assetLoader.isLoaded) {
        // Music
        this.sounds.music = new THREE.Audio(this.audioListener);
        this.sounds.music.setLoop(true);
        this.sounds.music.setVolume(0.3);
        this.sounds.music.setBuffer(assetLoader.getAudio("music"));
        this.sounds.music.play();

        // SFX
        this.sounds.good = new THREE.Audio(this.audioListener);
        this.sounds.good.setVolume(0.5);
        this.sounds.good.setBuffer(assetLoader.getAudio("goodSound"));

        this.sounds.bad = new THREE.Audio(this.audioListener);
        this.sounds.bad.setVolume(0.5);
        this.sounds.bad.setBuffer(assetLoader.getAudio("badSound"));

        const spawnBuffer = assetLoader.getAudio("spawn");
        this.sounds.spawn = new THREE.Audio(this.audioListener);
        this.sounds.spawn.setVolume(0.4);
        this.sounds.spawn.setBuffer(spawnBuffer);
      }
    } catch (error) {
      console.error("Error setting up audio: ", error);
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

    this.trashSpawner = new TrashSpawner(this.scene, this.sounds.spawn, () => {
      this.trashNotified = false;
    });

    this.gameObjects.push({
      id: "trashSpawner",
      type: "environment",
      object: this.trashSpawner,
      update: (delta) => this.trashSpawner.update(delta),
    });
  }

  update() {
    if (!this.stats.isPlaying) return;

    this.animationId = requestAnimationFrame(this.update.bind(this));

    const now = Date.now();
    const delta = now - (this.lastUpdate || now);
    this.lastUpdate = now;

    if (this.controls && CONFIG.DEBUG) {
      this.controlsEnabled = true;
      this.controls.update();
    }

    this.gameObjects.forEach((obj) => {
      if (obj.update) {
        obj.update(delta / 1000);
      }
    });

    if (this.player && this.trashSpawner) {
      this.checkActiveTrash();
    }

    this.renderer.render(this.scene, this.camera);
  }

  setPlayerCharacter(index) {
    if (this.player) {
      this.player.setCharacter(index);
    }
  }

  setCurrentScene(scene) {
    if (!this.isInitialized) return;
    this.stats.setCurrentScene(scene);
    this.input.setEnabled(scene === CONFIG.SCENES.GAME);
    this.updateReactState();
  }

  handlePauseRequest() {
    if (!this.isInitialized) return;
    if (this.stats.currentScene !== CONFIG.SCENES.GAME) return;

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

    // Also disable the OrbitControls themselves if they exist
    if (this.controls && CONFIG.DEBUG) {
      this.controls.enabled = false;
    }

    // Pause background music
    this.pauseBackgroundMusic();

    // Update game state
    this.stats.setPlaying(false);

    // First notify listeners that game is paused (before state update)
    this.emitEvent("gamePaused", {});

    // Then update the React state
    this.updateReactState();
    this.clearGameTimer(); // Stop the timer on pause
  }

  resume() {
    if (!this.isInitialized) {
      return;
    }

    if (this.animationId) {
      return;
    }

    this.controlsEnabled = true;
    this.lastUpdate = Date.now(); // Reset last update time

    // Make sure OrbitControls are enabled if they exist
    if (this.controls && CONFIG.DEBUG) {
      this.controls.enabled = true;
    }

    // Resume background music
    this.playBackgroundMusic();

    // Update game state
    this.stats.setPlaying(true);

    // First notify listeners that game is being resumed (before animation starts)
    this.emitEvent("gameResumed", {});

    // Then update the React state
    this.updateReactState();

    // Start animation loop
    this.update();

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

    this.stopBackgroundMusic();

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

    // Dispose of Three.js resources
    this.gameObjects.forEach((obj) => obj.destroy());

    // Remove renderer from DOM
    const container = document.getElementById(this.containerId);
    if (container && this.renderer) {
      container.removeChild(this.renderer.domElement);
    }

    this.isInitialized = false;
  }

  checkActiveTrash() {
    const trashItems = this.trashSpawner.getTrashItems();

    if (!trashItems.length) return;

    const activeTrash = trashItems[0];

    if (!activeTrash.isActive && !this.trashNotified) {
      activeTrash.selectTrash();
      this.emitEvent("notifyActiveTrash", {
        type: activeTrash.getTrashType(),
        requiredCombo: activeTrash.requiredCombination,
        modelName: activeTrash.modelName,
      });
      this.trashNotified = true;
    }
  }

  handleKeyCombo(combo) {
    this.keyCombo = combo;
    this.emitEvent("keyCombo", combo);

    // Only allow disposal for the first trash item
    if (this.trashSpawner && this.trashSpawner.trashItems.length > 0) {
      const activeTrash = this.trashSpawner.getActiveTrash();
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

        this.trashSpawner.removeActiveTrash();
        this.player.jump();
        this.input.resetCombo();

        // Notify about successful disposal
        this.emitEvent("trashDisposed", {
          type: trashType,
          score: this.stats.score,
        });
        this.updateReactState();
      }
    }
  }

  resetGame() {
    if (!this.isInitialized) return;

    // Clear all trash items
    if (this.trashSpawner) {
      this.trashSpawner.destroy();
      this.trashSpawner = new TrashSpawner(
        this.scene,
        this.sounds.spawn,
        () => {
          this.trashNotified = false;
        }
      );

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

    this.emitEvent("gameReset", this.stats.getState());
    this.pause();
    this.clearGameTimer();
  }

  startGameTimer() {
    if (this._gameTimer) clearTimeout(this._gameTimer);
    this._gameTimer = setTimeout(() => {
      this.setCurrentScene(CONFIG.SCENES.SCORE_SCREEN);
      this.pause();
    }, 120000);
  }

  clearGameTimer() {
    if (this._gameTimer) {
      clearTimeout(this._gameTimer);
      this._gameTimer = null;
    }
  }

  // Play background music
  playBackgroundMusic() {
    if (
      this.sounds.music &&
      this.sounds.music.buffer &&
      !this.sounds.music.isPlaying
    ) {
      this.sounds.music.play();
    }
  }

  pauseBackgroundMusic() {
    if (this.sounds.music && this.sounds.music.isPlaying) {
      this.sounds.music.pause();
    }
  }

  stopBackgroundMusic() {
    if (this.sounds.music && this.sounds.music.isPlaying) {
      this.sounds.music.stop();
    }
  }
}

export default Game;
