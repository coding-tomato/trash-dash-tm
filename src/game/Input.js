class Input {
  constructor({ onPause, onKeyCombo = null, enabled = true } = {}) {
    this.enabled = enabled;
    this.keys = {
      arrowUp: false,
      arrowDown: false,
      arrowLeft: false,
      arrowRight: false
    };

    this.recentKeys = [];
    this.keyTimeout = 1000; 
    this.lastKeyTime = 0;
    
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
        case " ": // For older browsers
          e.preventDefault();
          this.keys.space = true;
          this.resetCombo();
          break;
        case "ArrowUp":
          e.preventDefault(); 
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
        case " ": // For older browsers
          e.preventDefault();
          this.keys.space = false;
          break;
        case "ArrowUp":
          e.preventDefault(); 
          this.keys.arrowUp = false;
          break;
        case "ArrowDown":
          e.preventDefault(); 
          this.keys.arrowDown = false;
          break;
        case "ArrowLeft":
          e.preventDefault(); 
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
    this.handlers.onKeyCombo([]);
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
