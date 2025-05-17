import * as THREE from "three";

class Player {
  constructor(scene) {
    // Initialize character index
    this.characterIndex = 1; // Default to character 1
    
    this.group = new THREE.Group();
    this.group.position.set(0, 1, -1);

    // Animation properties
    this.frameWidth = 118;
    this.frameHeight = 140;
    this.totalFrames = 4; // Adjust based on your spritesheet
    this.currentFrame = 0;
    this.animationSpeed = 10; // Increased animation speed
    this.animationCounter = 0;

    // Jump properties
    this.isJumping = false;
    this.jumpHeight = 0.6;
    this.jumpDuration = 0.4; // seconds
    this.jumpTimer = 0;
    this.initialY = 1; // Store the initial Y position

    // Load the sprite texture
    this.loadCharacterSprite();

    // Create a plane geometry for the sprite
    const aspectRatio = this.frameWidth / this.frameHeight;
    const planeGeometry = new THREE.PlaneGeometry(2 * aspectRatio, 2); // Adjust size as needed
    
    this.planeMaterial = new THREE.MeshBasicMaterial({
      map: this.spriteTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });

    // Set up the UV coordinates for the first frame
    this.updateUVs(planeGeometry);

    // Create a plane mesh instead of sprite
    this.mesh = new THREE.Mesh(planeGeometry, this.planeMaterial);
    this.group.rotation.y = Math.PI; // Face forward
    this.mesh.rotation.x = 0; // Changed from -Math.PI/12
    this.mesh.position.set(0, 0, 0);
    this.group.add(this.mesh);

    scene.add(this.group);
  }

  loadCharacterSprite() {
    // Load the sprite texture based on the character index
    const textureLoader = new THREE.TextureLoader();
    const spritePath = `./characters${this.characterIndex}_idle.png`;
    this.spriteTexture = textureLoader.load(spritePath);
    this.spriteTexture.magFilter = THREE.NearestFilter;
    this.spriteTexture.minFilter = THREE.NearestFilter;
    this.spriteTexture.flipY = true;
    return this.spriteTexture;
  }

  updateUVs(geometry) {
    // Get the texture dimensions based on the actual spritesheet
    const textureWidth = this.frameWidth * this.totalFrames;

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

  jump() {
    if (!this.isJumping) {
      this.isJumping = true;
      this.jumpTimer = 0;
      this.initialY = this.group.position.y; // Store the starting Y position
    }
  }

  setCharacter(index) {
    this.characterIndex = index;
    
    // Update the sprite texture when character changes
    this.loadCharacterSprite();
    
    // Update the material's map with the new texture
    if (this.planeMaterial) {
      this.planeMaterial.map = this.spriteTexture;
      this.planeMaterial.needsUpdate = true;
    }
    
    // Reset animation frame
    this.currentFrame = 0;
    this.updateUVs(this.mesh.geometry);
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

    // Handle jump animation if jumping
    if (this.isJumping) {
      this.jumpTimer += deltaTime;

      if (this.jumpTimer >= this.jumpDuration) {
        // Jump is complete, reset position and state
        this.group.position.y = this.initialY;
        this.isJumping = false;
      } else {
        // Calculate jump position using sine curve for smooth up and down
        const jumpProgress = this.jumpTimer / this.jumpDuration;
        const jumpOffset = Math.sin(jumpProgress * Math.PI) * this.jumpHeight;
        this.group.position.y = this.initialY + jumpOffset;
      }
    }
  }

  destroy(scene) {
    if (this.group) {
      if (this.mesh) {
        if (this.mesh.geometry) this.mesh.geometry.dispose();
        if (this.mesh.material) this.mesh.material.dispose();
        if (this.mesh.material && this.mesh.material.map)
          this.mesh.material.map.dispose();
      }

      scene.remove(this.group);
    }
  }
}

export default Player;
