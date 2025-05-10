import * as THREE from "three";
import { CONFIG } from "../config.js";

class Scenario {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
    this.setupFloor();
    this.setupShadowCastingObjects();
    this.setupGridHelper();
    this.setupLighting();
  }

  setupFloor() {
    const floorGeometry = new THREE.PlaneGeometry(20, 5);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x98fb98, // Pastel Mint
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.objects.push(floor);
  }

  setupShadowCastingObjects() {
    const createShadowCaster = (x, y, z, width, height, depth, color) => {
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.3,
        roughness: 0.5,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.objects.push(mesh);
      return mesh;
    };
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
    this.spotLight = new THREE.SpotLight(0xffffff, 40);
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
}

export default Scenario;
