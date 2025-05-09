class Input {
  constructor({ onFire, onPause, onKeyCombo = null, enabled = true } = {}) {
    this.enabled = enabled;
    this.keys = {
      space: false,
      arrowUp: false,
      arrowDown: false,
      arrowLeft: false,
      arrowRight: false
    };
    // Recently pressed keys for combinations
    this.recentKeys = [];
    this.keyTimeout = 1000; // Time in ms to consider keys part of the same combination
    this.lastKeyTime = 0;
    
    // We no longer need onMove handler since movement is handled by OrbitControls
    this.handlers = { onPause, onKeyCombo };
    this._bindHandlers();
  }

  _bindHandlers() {
    this.handleKeyDown = (e) => {
      if (!this.enabled) return;
      
      const now = Date.now();
      
      switch (e.key) {
        case "Escape":
          if (this.handlers.onPause) this.handlers.onPause();
          break;
        case "ArrowUp":
          e.preventDefault(); // Prevent default scrolling
          this.keys.arrowUp = true;
          this._addToCombo("up", now);
          break;
        case "ArrowDown":
          e.preventDefault(); // Prevent default scrolling
          this.keys.arrowDown = true;
          this._addToCombo("down", now);
          break;
        case "ArrowLeft":
          e.preventDefault(); // Prevent default scrolling
          this.keys.arrowLeft = true;
          this._addToCombo("left", now);
          break;
        case "ArrowRight":
          e.preventDefault(); // Prevent default scrolling
          this.keys.arrowRight = true;
          this._addToCombo("right", now);
          break;
        default:
          break;
      }
    };
    
    this.handleKeyUp = (e) => {
      switch (e.key) {
        case " ":
          e.preventDefault(); // Prevent default scrolling for space
          this.keys.space = false;
          break;
        case "ArrowUp":
          e.preventDefault(); // Prevent default scrolling
          this.keys.arrowUp = false;
          break;
        case "ArrowDown":
          e.preventDefault(); // Prevent default scrolling
          this.keys.arrowDown = false;
          break;
        case "ArrowLeft":
          e.preventDefault(); // Prevent default scrolling
          this.keys.arrowLeft = false;
          break;
        case "ArrowRight":
          e.preventDefault();
          this.keys.arrowRight = false;
          break;
        default:
          break;
      }
    };
  }

  _addToCombo(key, timestamp) {
    if (timestamp - this.lastKeyTime > this.keyTimeout) {
      this.recentKeys = [];
    }
    
    this.recentKeys.push(key);
    this.lastKeyTime = timestamp;
    
    if (this.recentKeys.length > 4) {
      this.recentKeys.shift();
    }
    
    if (this.handlers.onKeyCombo) {
      this.handlers.onKeyCombo([...this.recentKeys]);
    }
  }

  getCombo() {
    return [...this.recentKeys];
  }

  resetCombo() {
    this.recentKeys = [];
  }

  attach() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  detach() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }

  setEnabled(val) {
    this.enabled = val;
  }

  getState() {
    return { ...this.keys };
  }
}

export default Input;
