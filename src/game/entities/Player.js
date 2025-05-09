import * as THREE from 'three';

class Player {
  constructor(scene) {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xFFB6C1, // Bright pastel pink color
      metalness: 0.3,
      roughness: 0.4,
    });

    this.group = new THREE.Group();
    this.group.position.set(0, 1, 0);
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, 0); // Slightly raised above the ground
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);
    
    const colliderSize = new THREE.Vector3(4, 5, 1.2); // Slightly larger than the player
    this.collider = new THREE.Box3();
    
    const boxGeometry = new THREE.BoxGeometry(
      colliderSize.x, 
      colliderSize.y, 
      colliderSize.z
    );
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    this.colliderMesh = new THREE.Mesh(boxGeometry, wireframeMaterial);
    this.group.add(this.colliderMesh);
    
    // Movement properties
    this.speed = 0.1;
    this.rotationSpeed = 0.05;
    
    // Game properties
    this.score = 0;
    
    // Add to scene
    scene.add(this.group);
  }
  
  move(direction) {
    // Convert direction string to movement on the X-Z plane (top-down)
    switch(direction) {
      case 'forward':
        this.group.translateZ(-this.speed);
        break;
      case 'backward':
        this.group.translateZ(this.speed);
        break;
      case 'left':
        this.group.translateX(-this.speed);
        break;
      case 'right':
        this.group.translateX(this.speed);
        break;
      default:
        break;
    }
  }
  
  update(delta) {
    // Update the collider to match the player's position
    this.updateCollider();
  }
  
  updateCollider() {
    // Update the Box3 collider to match the current position
    const position = this.getPosition();
    
    // Get the bounding box of the collider mesh
    const size = new THREE.Vector3();
    new THREE.Box3()
      .setFromObject(this.colliderMesh)
      .getSize(size);
    
    // Update the Box3 collider with the current position
    this.collider.setFromCenterAndSize(
      position,
      size
    );
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
  
  getPosition() {
    return this.group.position.clone();
  }
  
  getGameState() {
    return {
      score: this.score,
      position: this.getPosition()
    };
  }
  
  addScore(points) {
    this.score += points;
    return this.score;
  }
  
  destroy(scene) {
    if (this.group) {
      if (this.mesh) {
        if (this.mesh.geometry) this.mesh.geometry.dispose();
        if (this.mesh.material) this.mesh.material.dispose();
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