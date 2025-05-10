import * as THREE from "three";
import { CONFIG } from "../../config";

class Player {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, 1, -1);

    // Animation properties
    this.frameWidth = 118;
    this.frameHeight = 140;
    this.totalFrames = 4; // Adjust based on your spritesheet
    this.currentFrame = 0;
    this.animationSpeed = 10; // Increased animation speed
    this.animationCounter = 0;

    // Load the sprite texture
    const textureLoader = new THREE.TextureLoader();
    const spriteTexture = textureLoader.load("/characters2_idle.png");
    spriteTexture.magFilter = THREE.NearestFilter;
    spriteTexture.minFilter = THREE.NearestFilter;
    spriteTexture.flipY = true;

    // Create a plane geometry for the sprite
    const aspectRatio = this.frameWidth / this.frameHeight;
    const planeGeometry = new THREE.PlaneGeometry(2 * aspectRatio, 2); // Adjust size as needed
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: spriteTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });

    // Set up the UV coordinates for the first frame
    this.updateUVs(planeGeometry);

    // Create a plane mesh instead of sprite
    this.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
    // Adjust rotation to fix orientation
    this.mesh.rotation.y = 0; // Changed from Math.PI to correctly orient the player
    // Remove the tilt to make sure it's flat facing the camera
    this.mesh.rotation.x = 0; // Changed from -Math.PI/12
    this.mesh.position.set(0, 0, 0);
    this.group.add(this.mesh);

    // Adjust the group rotation to face the camera correctly
    this.group.rotation.y = Math.PI; // Face forward

    const colliderSize = new THREE.Vector3(4, 5, 5); // Slightly larger than the player
    this.collider = new THREE.Box3();

    if (CONFIG.DEBUG) {
      const boxGeometry = new THREE.BoxGeometry(
        colliderSize.x,
        colliderSize.y,
        colliderSize.z
      );
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });
      this.colliderMesh = new THREE.Mesh(boxGeometry, wireframeMaterial);
      this.group.add(this.colliderMesh);
    }

    scene.add(this.group);
  }

  updateUVs(geometry) {
    // Get the texture dimensions based on the actual spritesheet
    const textureWidth = this.frameWidth * this.totalFrames;
    const textureHeight = this.frameHeight;

    // Calculate the frame position in UV coordinates
    const frameU = (this.frameWidth * this.currentFrame) / textureWidth;
    const frameUWidth = this.frameWidth / textureWidth;

    // Update UVs to show the current frame
    const uvs = geometry.attributes.uv;

    // Fix UV mapping to correct orientation
    // Top-left (was Bottom left)
    uvs.setXY(0, frameU, 1);
    // Top-right (was Bottom right)
    uvs.setXY(1, frameU + frameUWidth, 1);
    // Bottom-left (was Top left)
    uvs.setXY(2, frameU, 0);
    // Bottom-right (was Top right)
    uvs.setXY(3, frameU + frameUWidth, 0);

    uvs.needsUpdate = true;
  }

  update(deltaTime) {
    // Update animation
    this.animationCounter += deltaTime * this.animationSpeed;

    if (this.animationCounter >= 1) {
      // Advance to next frame
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
      this.updateUVs(this.mesh.geometry);
      this.animationCounter = 0;
    }

    // Update the box collider to match the player's position
    this.collider.setFromObject(this.mesh);
  }

  checkCollision(object) {
    // Check if the object has a collider or if we need to create a temporary one
    let objectCollider;

    if (object.collider) {
      objectCollider = object.collider;
    } else if (object.mesh) {
      objectCollider = new THREE.Box3().setFromObject(object.mesh);
    } else {
      return false;
    }

    // Return true if colliders intersect
    return this.collider.intersectsBox(objectCollider);
  }

  destroy(scene) {
    if (this.group) {
      if (this.mesh) {
        if (this.mesh.geometry) this.mesh.geometry.dispose();
        if (this.mesh.material) this.mesh.material.dispose();
        if (this.mesh.material && this.mesh.material.map)
          this.mesh.material.map.dispose();
      }

      if (this.colliderMesh) {
        if (this.colliderMesh.geometry) this.colliderMesh.geometry.dispose();
        if (this.colliderMesh.material) this.colliderMesh.material.dispose();
      }

      scene.remove(this.group);
    }
  }
}

export default Player;
