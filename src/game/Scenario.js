import * as THREE from "three";
import { CONFIG } from "../config.js";
import assetLoader from "./AssetLoader.js";

class Scenario {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
    this.setupGridHelper();
    this.setupLighting();
    this.setupBackgroundProp();
  }

  setupGridHelper() {
    if (CONFIG.DEBUG) {
      const gridHelper = new THREE.GridHelper(20, 24, 0xccccff, 0xffffff);
      this.scene.add(gridHelper);
      this.objects.push(gridHelper);
    }
  }

  setupLighting() {
    // Torch-like spotlight
    this.spotLight = new THREE.SpotLight(0xffffff, 70);
    this.spotLight.angle = Math.PI;
    this.spotLight.penumbra = 0.9;
    this.spotLight.decay = 2.0;
    this.spotLight.distance = 18;
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.width = 1024;
    this.spotLight.shadow.mapSize.height = 1024;
    this.spotLight.shadow.camera.near = 0.5;
    this.spotLight.shadow.camera.far = 20;
    this.spotLight.shadow.bias = -0.0005;
    this.spotLight.position.set(0, 4, 0);
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(0, 0, 0);
    this.scene.add(spotTarget);
    this.spotLight.target = spotTarget;
    this.scene.add(this.spotLight);
    this.objects.push(this.spotLight);
    // Bulb
    const bulbGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const bulbMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffcc,
    });
    const bulbMesh = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulbMesh.position.copy(this.spotLight.position);
    this.scene.add(bulbMesh);
    this.objects.push(bulbMesh);
  }

  setupBackgroundProp() {
    // Only add if loaded
    if (assetLoader.isLoaded) {
      const decorations = [
        { key: "props", position: [0, 0, 0] },
      ];
      decorations.forEach(({ key, position }) => {
        const model = assetLoader.getModel(key);
        if (model) {
          model.position.set(...position);
          model.traverse(child => {
            if (child.isMesh) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x98b253,
              });
              child.castShadow = false;
              child.receiveShadow = true;
            }
          });
          this.scene.add(model);
          this.objects.push(model);
        }
      });
    }
  }
}

export default Scenario;
