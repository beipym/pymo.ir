import * as THREE from 'three';

// Interface for the data we'll store in our WeakMap per element
interface ElementInstanceData {
  animationFrameId?: number;
  resizeHandler?: () => void;
  threeContext?: ThreeContext; // Holds all Three.js related objects
  lastTimestamp?: number; // To calculate delta time for smooth animation
}

// Interface for the Three.js context associated with an element
interface ThreeContext {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>;
  // Example for shader material if you go that route:
  // shaderMaterial?: THREE.ShaderMaterial;
}

//utility to generate colors 
const getRandomColor = ()=>{
  const color = Math.floor(Math.random() * 16777216).toString(16);
// Avoid loops.
  return `#${color}`;
}

// WeakMap to store all data associated with an element instance
// This is defined once, after the interfaces it uses.
const elementInstanceRegistry = new WeakMap<HTMLElement, ElementInstanceData>();

/**
 * Initializes the Three.js scene, renderer, camera, and a full-screen plane.
 * @param element - The custom element instance (ThreeBackgroundWC).
 */
export function setupThreeScene(element: HTMLElement): void {
  if (!element.shadowRoot) {
    element.attachShadow({ mode: 'open' });
  }
  element.shadowRoot!.innerHTML = ''; // Clear previous content

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '-1'; // Ensure it's a background
  canvas.style.display = 'block';
  element.shadowRoot!.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true, // For transparency, if needed
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 5; // Position the camera

  const planeGeometry = new THREE.PlaneGeometry(1, 1); // A plane that will fill the screen
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  vertices.push(0,0,0,0,1,0,0,0,1);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices,3))
  // Default color for the plane, taken from 'bgColor' attribute or defaults to white
  
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(getRandomColor()),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const threeContext: ThreeContext = {
    canvas,
    renderer,
    scene,
    camera,
    mesh,
  };

  const currentData = elementInstanceRegistry.get(element) || {};
  elementInstanceRegistry.set(element, { ...currentData, threeContext });

  handleResize(element); // Adjust size on initialization
}

/**
 * The animation loop.
 * @param element - The custom element instance.
 * @param timestamp - The current time in milliseconds, provided by requestAnimationFrame.
 */
export function animate(element: HTMLElement, timestamp?: number): void {
  const data = elementInstanceRegistry.get(element);
  if (!element.isConnected || !data || !data.threeContext) return; // Exit if not ready

  const { renderer, scene, camera, mesh } = data.threeContext;

  // Animation Logic
  if (timestamp === undefined) {
    data.lastTimestamp = performance.now();
  } else {
    if (data.lastTimestamp === undefined) {
        data.lastTimestamp = timestamp;
    }
    const deltaTime = (timestamp - data.lastTimestamp) / 1000; // Time since last frame in seconds

    // Example: Rotate the plane
    mesh.rotation.x += 0.7 * deltaTime *3;
    mesh.rotation.y += 0.7 * deltaTime;

    data.lastTimestamp = timestamp; // Store current time for next frame
  }

  renderer.render(scene, camera); // Draw the scene

  // Continue the loop
  data.animationFrameId = requestAnimationFrame((ts) => animate(element, ts));
  elementInstanceRegistry.set(element, data);
}

/**
 * Handles window resize events to keep the scene full-screen and correctly proportioned.
 * @param element - The custom element instance.
 */
export function handleResize(element: HTMLElement): void {
  const data = elementInstanceRegistry.get(element);
  if (!data || !data.threeContext || !element.isConnected) return;

  const { renderer, camera } = data.threeContext;
  const newWidth = window.innerWidth;
  const newHeight = window.innerHeight;

  renderer.setSize(newWidth, newHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance

  // Adjust OrthographicCamera for aspect ratio
  const aspect = newWidth / newHeight;
  if (aspect >= 1) { // Landscape or square
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
  } else { // Portrait
    camera.left = -1;
    camera.right = 1;
    camera.top = 1 / aspect;
    camera.bottom = -1 / aspect;
  }
  camera.updateProjectionMatrix(); // Apply camera changes

  // Example: If using a shader that needs resolution
  // const { shaderMaterial } = data.threeContext;
  // if (shaderMaterial && shaderMaterial.uniforms.uResolution) {
  //   shaderMaterial.uniforms.uResolution.value.set(newWidth, newHeight);
  // }
}

/**
 * Sets up event listeners (e.g., window resize).
 * @param element - The custom element instance.
 */
export function setupEventListeners(element: HTMLElement): void {
  // Create a specific handler for this element to allow proper removal later
  const specificResizeHandler = () => handleResize(element);

  const currentData = elementInstanceRegistry.get(element) || {};
  currentData.resizeHandler = specificResizeHandler; // Store for cleanup
  elementInstanceRegistry.set(element, currentData);

  window.addEventListener('resize', specificResizeHandler);
}

/**
 * Cleans up event listeners associated with the element.
 * @param element - The custom element instance.
 */
function cleanupEventListeners(element: HTMLElement): void {
  const data = elementInstanceRegistry.get(element);
  if (data && data.resizeHandler) {
    window.removeEventListener('resize', data.resizeHandler);
    delete data.resizeHandler; // Remove from our stored data
  }
}

/**
 * Cleans up Three.js resources and stops animation when the element is removed from the DOM.
 * @param element - The custom element instance.
 */
export function cleanupThreeResources(element: HTMLElement): void {
  const data = elementInstanceRegistry.get(element);
  if (!data) return;

  // Stop the animation loop
  if (data.animationFrameId) {
    cancelAnimationFrame(data.animationFrameId);
    delete data.animationFrameId;
  }

  // Dispose of Three.js objects to free up GPU memory
  if (data.threeContext) {
    const { renderer, scene, mesh, canvas } = data.threeContext;

    if (mesh) {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach(material => {
          if ((material as THREE.MeshBasicMaterial).map) {
            (material as THREE.MeshBasicMaterial).map!.dispose(); // Dispose textures
          }
          material.dispose(); // Dispose material
        });
      }
      scene.remove(mesh); // Remove from scene
    }

    if (renderer) renderer.dispose(); // Dispose renderer
    if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas); // Remove canvas from DOM
    }
    if (element.shadowRoot) {
        element.shadowRoot.innerHTML = ''; // Clear shadow DOM
    }
    delete data.threeContext; // Remove Three.js context from our stored data
  }

  cleanupEventListeners(element); // Remove event listeners

  // WeakMap will eventually garbage collect the entry for `element`
  // if the element itself is garbage collected.
  // elementInstanceRegistry.delete(element); // Could be used for immediate removal if needed
}

/**
 * Updates the material of the plane based on HTML attributes.
 * @param element - The custom element instance.
 * @param name - The name of the attribute that changed.
 * @param newValue - The new value of the attribute.
 */
export function updateMaterialFromAttributes(element: HTMLElement, name: string, newValue: string | null): void {
    const data = elementInstanceRegistry.get(element);
    if (!data || !data.threeContext || newValue === null) return;

    const { mesh } = data.threeContext;

    // Ensure we have a plane and a single material to update
    if (mesh && mesh.material && !(Array.isArray(mesh.material))) {
        const material = mesh.material as THREE.MeshBasicMaterial;
        if (name === 'bgColor' && material.color) {
            material.color.set(newValue); // Update color
        }
        // Example: Handle attributes for shader uniforms
        // if (name === 'color1' && data.threeContext.shaderMaterial?.uniforms.uColor1) {
        //   data.threeContext.shaderMaterial.uniforms.uColor1.value.set(newValue);
        // }
    }
}
