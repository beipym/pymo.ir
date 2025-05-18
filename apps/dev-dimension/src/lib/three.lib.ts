import * as THREE from 'three';

// Interface for the data we'll store in our WeakMap per element
interface ElementInstanceData {
  animationFrameId?: number;
  resizeHandler?: () => void;
  threeContext?: ThreeContext; 
  lastTimestamp?: number; 
}

// Interface for the Three.js context associated with an element
interface ThreeContext {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  meshGroup: THREE.Group;
}

const clock = new THREE.Clock();
let lastActionTime = 0;
const actionIntervalSeconds = 1.0; // Do something every 1 second

const shapesInAct: THREE.Mesh[] = [];

let currentIndex = 0;

//utility to generate colors 
const getRandomColor = ()=>{
  const color = Math.floor(Math.random() * 16777216).toString(16);
// Avoid loops.
  return `#${color}`;
}

// Create this once and reuse it for all shapes
const sharedShapeMaterial = new THREE.MeshBasicMaterial({
  vertexColors: true, // This is the key!
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.6
});

// WeakMap to store all data associated with an element instance
// This is defined once, after the interfaces it uses.
const elementInstanceRegistry = new WeakMap<HTMLElement, ElementInstanceData>();


const shapeGen = () => {

  const geometry = new THREE.BufferGeometry();

  const vertexPositions = new Float32Array([
    0, 0, 0,                         // Vertex 1
    Math.random(), Math.random(), Math.random(), // Vertex 2
    Math.random(), Math.random(), Math.random()  // Vertex 3
  ]);

  const vertexColorsData = new Float32Array([
    Math.random(), Math.random(), Math.random(), // Color for Vertex 1
    Math.random(), Math.random(), Math.random(), // Color for Vertex 2
    Math.random(), Math.random(), Math.random()  // Color for Vertex 3
  ]);

  geometry.setAttribute("position", new THREE.BufferAttribute(vertexPositions,3));
  geometry.setAttribute("color", new THREE.BufferAttribute(vertexColorsData,3));
  return geometry;
}

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
  camera.position.z = 2; // Position the camera

  const meshGroup = new THREE.Group();
  scene.add(meshGroup);

  const threeContext: ThreeContext = {
    canvas,
    renderer,
    scene,
    camera,
    meshGroup,
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

  const { renderer, scene, camera, meshGroup } = data.threeContext;

  // Animation Logic
  if (timestamp === undefined) {
    data.lastTimestamp = performance.now();
  } else {
    if (data.lastTimestamp === undefined) {
        data.lastTimestamp = timestamp;
    }
    const deltaTime = (timestamp - data.lastTimestamp) / 1000; // Time since last frame in seconds
    
    meshGroup.rotation.x += 0.2 * deltaTime *3;
    meshGroup.rotation.y -= 0.2 * deltaTime;

    data.lastTimestamp = timestamp; // Store current time for next frame
  }

  renderer.render(scene, camera); // Draw the scene

  // Continue the loop
  data.animationFrameId = requestAnimationFrame((ts) => animate(element, ts));
  elementInstanceRegistry.set(element, data);

  const elapsedTime = clock.getElapsedTime(); // Total time since Clock was started

  if (elapsedTime - lastActionTime >= actionIntervalSeconds ) {
    console.log(`Action triggered at time: ${elapsedTime.toFixed(2)}s`);
    // --- YOUR CODE TO RUN AT THIS TIME GOES HERE ---

    lastActionTime = elapsedTime; // Reset the last action time
    // Or, for more precise intervals: lastActionTime += actionIntervalSeconds;
    // This prevents drift if a frame takes slightly longer than the interval.
    
    if( shapesInAct.length < 15 ){
      
      const mesh = new THREE.Mesh(shapeGen(), sharedShapeMaterial);

      mesh.rotation.x = Math.random() * Math.PI * 2;
      mesh.rotation.y = Math.random() * Math.PI * 2;
      mesh.rotation.z = Math.random() * Math.PI * 2;   
      meshGroup.add(mesh);

      meshGroup.scale.set(0.5,0.5,0.5)
      
      shapesInAct.push(mesh)
     
    } else{

        const delMesh = shapesInAct[0];
        shapesInAct.shift();
        if (delMesh.geometry) delMesh.geometry.dispose();
        if (delMesh.material) {
          const materials = Array.isArray(delMesh.material) ? delMesh.material : [delMesh.material];
          materials.forEach(material => {
            if ((material as THREE.MeshBasicMaterial).map) {
              (material as THREE.MeshBasicMaterial).map!.dispose(); // Dispose textures
            }
            material.dispose(); // Dispose material
          });
        }
        meshGroup.remove(delMesh); // Remove from scene

      }

  } 
  

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

  cleanupEventListeners(element); // Remove event listeners

}