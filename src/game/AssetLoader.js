import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/**
 * AssetLoader handles pre-loading of 3D models and textures
 * to ensure they're available when needed during gameplay
 */
class AssetLoader {
  constructor() {
    this.models = {};
    this.audio = {};
    this.isLoaded = false;
    this.loadingPromise = null;
    this.modelPaths = {
      // Glass items
      botellaVino: './SM_BotellaVino.fbx',
      botellin: './SM_Botellin.fbx',
      copaRota: './SM_CopaRota.fbx',
      botellaLicor: './SM_BotellaLicor.fbx',
      
      // metal_and_plastic items
      botellaPlastico: './SM_BotellaPlastico.fbx',
      bolsa: './SM_Bolsa.fbx',
      sodaCan: './SM_SodaCan.fbx',
      lataAtun: './SM_LataAtun.fbx',
      
      // Organic items
      bananaPeel: './SM_BananaPeel.fbx',
      manzana: './SM_Manzana.fbx',
      musloPollo: './SM_MusloPollo.fbx',
      pizzaSlice: './SM_PizzaSlice.fbx',
      eggShell: './SM_Eggshell.fbx',

      // Paper
      pizzaBox: './SM_PizzaBox.fbx',
      paper: './SM_Paper.fbx',
      paperRoll: './SM_PaperRoll.fbx',

      // Non-recyclable items
      jeringuilla: './SM_Jeringuilla.fbx',
      bateria: './SM_Bateria.fbx',
      movil: './SM_Movil.fbx',

      // Decoration/background
      props: './SMEnviroPack.fbx'
    };
    
    this.audioPaths = {
      music: './music.mp3',
      goodSound: './OK.wav',
      badSound: './BAD.wav',
      spawn: './SPAWN.mp3'
    };
  }

  /**
   * Preload all models and audio defined in modelPaths and audioPaths
   * @returns {Promise} A promise that resolves when all models and audio are loaded
   */
  preloadAssets() {
    // If we've already started loading, return the existing promise
    if (this.loadingPromise) {
      return this.loadingPromise;
    }
    
    const fbxLoader = new FBXLoader();
    const audioLoader = new THREE.AudioLoader();
    const promises = [];
    
    // Load each model defined in modelPaths
    for (const [key, path] of Object.entries(this.modelPaths)) {
      const promise = new Promise((resolve, reject) => {
        fbxLoader.load(
          path,
          (fbx) => {
            // Scale and process the model once during preload
            fbx.scale.set(0.04, 0.04, 0.04);
            
            fbx.traverse((child) => {
              if (child.isMesh) {
                // Create a reusable material
                child.material = new THREE.MeshPhongMaterial({
                  color: 0x9ACD32,
                });
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.flatShading = true;
              }
            });
            
            this.models[key] = fbx;
            resolve(fbx);
          },
          // Progress callback
          undefined,
          // Error callback
          (error) => {
            console.error(`Error loading model: ${path}`, error);
            reject(error);
          }
        );
      });
      
      promises.push(promise);
    }
    
    // Load each audio defined in audioPaths
    for (const [key, path] of Object.entries(this.audioPaths)) {
      const promise = new Promise((resolve, reject) => {
        audioLoader.load(
          path,
          (buffer) => {
            this.audio[key] = buffer;
            resolve(buffer);
          },
          undefined,
          (error) => {
            console.error(`Error loading audio: ${path}`, error);
            reject(error);
          }
        );
      });
      
      promises.push(promise);
    }
    
    // Create a single promise that resolves when all assets are loaded
    this.loadingPromise = Promise.all(promises).then(() => {
      this.isLoaded = true;
      return true;
    }).catch(error => {
      console.error('Failed to load all assets:', error);
      return false;
    });
    
    return this.loadingPromise;
  }
  
  /**
   * Get a clone of a preloaded model
   * @param {string} modelKey - The key of the model to retrieve
   * @returns {THREE.Object3D} A clone of the requested model
   */
  getModel(modelKey) {
    if (!this.isLoaded || !this.models[modelKey]) {
      console.warn(`Model ${modelKey} not loaded yet or doesn't exist`);
      return null;
    }
    
    // Clone the model to avoid modifying the original
    return this.models[modelKey].clone();
  }

  /**
   * Get a preloaded audio buffer
   * @param {string} audioKey - The key of the audio to retrieve
   * @returns {AudioBuffer} The requested audio buffer
   */
  getAudio(audioKey) {
    if (!this.isLoaded || !this.audio[audioKey]) {
      console.warn(`Audio ${audioKey} not loaded yet or doesn't exist`);
      return null;
    }
    
    return this.audio[audioKey];
  }
}

// Create a singleton instance
const assetLoader = new AssetLoader();

export default assetLoader;