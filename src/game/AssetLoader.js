import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/**
 * AssetLoader handles pre-loading of 3D models and textures
 * to ensure they're available when needed during gameplay
 */
class AssetLoader {
  constructor() {
    this.models = {};
    this.isLoaded = false;
    this.loadingPromise = null;
    this.modelPaths = {
      // Glass items
      botellaVino: '/SM_BotellaVino.fbx',
      botellin: '/SM_Botellin.fbx',
      copaRota: '/SM_CopaRota.fbx',
      botellaLicor: '/SM_BotellaLicor.fbx',
      
      // Plastic items
      botellaPlastico: '/SM_BotellaPlastico.fbx',
      bolsa: '/SM_Bolsa.fbx',
      jeringuilla: '/SM_Jeringuilla.fbx',
      
      // Metal items
      sodaCan: '/SM_SodaCan.fbx',
      lataAtun: '/SM_LataAtun.fbx',
      bateria: '/SM_Bateria.fbx',
      movil: '/SM_Movil.fbx',
      
      // Organic items
      bananaPeel: '/SM_BananaPeel.fbx',
      manzana: '/SM_Manzana.fbx',
      musloPollo: '/SM_MusloPollo.fbx'
    };
  }

  /**
   * Preload all models defined in modelPaths
   * @returns {Promise} A promise that resolves when all models are loaded
   */
  preloadAssets() {
    // If we've already started loading, return the existing promise
    if (this.loadingPromise) {
      return this.loadingPromise;
    }
    
    const loader = new FBXLoader();
    const promises = [];
    
    // Load each model defined in modelPaths
    for (const [key, path] of Object.entries(this.modelPaths)) {
      const promise = new Promise((resolve, reject) => {
        loader.load(
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
    
    // Create a single promise that resolves when all models are loaded
    this.loadingPromise = Promise.all(promises).then(() => {
      this.isLoaded = true;
      console.log('All 3D models loaded successfully');
      return true;
    }).catch(error => {
      console.error('Failed to load all models:', error);
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
}

// Create a singleton instance
const assetLoader = new AssetLoader();

export default assetLoader;