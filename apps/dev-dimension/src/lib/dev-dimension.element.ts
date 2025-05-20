// File: libs/three-background/src/main.ts
// Import the necessary functions from our logic file
import {
  setupThreeScene,
  animate,
  setupEventListeners,
  cleanupThreeResources,
  // handleResize (only if needed to be called directly from class, usually not)
} from './three.lib'; // Adjust path as necessary

// Extend HTMLElement to get DOM element functionalities
export class DevDimension extends HTMLElement {
  constructor() {
    super(); // Always call super first in constructor
    // Minimal work in constructor. Initialization is best in connectedCallback.
  }

  connectedCallback(): void {
    setupThreeScene(this);
    setupEventListeners(this);
    animate(this);
   
  }

  disconnectedCallback(): void {
    cleanupThreeResources(this); // Crucial for preventing memory leaks
  }

  // Define which attributes should trigger attributeChangedCallback
  static get observedAttributes(): string[] {
    return []; // Add more if you use them for shaders
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue || !this.isConnected) {
      return; 
    }
    // Delegate attribute handling to the logic function
  }
}
