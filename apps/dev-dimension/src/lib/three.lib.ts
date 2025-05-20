import * as THREE from 'three';
import { EffectComposer, RenderPass, UnrealBloomPass } from 'three/examples/jsm/Addons.js';

// Configuration constants
const CONFIG = {
  MAX_SHAPES: 20,
  ACTION_INTERVAL: 1.0,
  BLOOM: {
    STRENGTH: 1.5,
    RADIUS: 0.4,
    THRESHOLD: 0.8
  },
  MATERIAL: {
    EMISSIVE_INTENSITY: 2.5,
    METALNESS: 0.8,
    ROUGHNESS: 0.2,
    OPACITY: 0.9,
    COLOR: 0xffffff,
    SHININESS: 100
  }
} as const;

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
  composer: EffectComposer;
}

const clock = new THREE.Clock();
let lastActionTime = 0;
const shapesInAct: THREE.Mesh[] = [];

// Create this once and reuse it for all shapes
const sharedShapeMaterial = new THREE.MeshPhongMaterial({
  vertexColors: true,
  side: THREE.DoubleSide,
  shininess: CONFIG.MATERIAL.SHININESS,
  specular: 0xffffff,
  transparent: true,
  opacity: CONFIG.MATERIAL.OPACITY,
});

// WeakMap to store all data associated with an element instance
const elementInstanceRegistry = new WeakMap<HTMLElement, ElementInstanceData>();

const shapeGen = (): THREE.BufferGeometry => {
  const geometry = new THREE.BufferGeometry();
  // Create more complex vertex positions for better shape definition
  const vertexPositions = new Float32Array([
    0, 0, 0,
    Math.random() , Math.random() , Math.random() ,
    Math.random() , Math.random() , Math.random() 
  ]);

  // Create more vibrant colors
  const vertexColorsData = new Float32Array([
    Math.random(), Math.random(), Math.random(),
    Math.random(), Math.random(), Math.random(),
    Math.random(), Math.random(), Math.random()
  ]);

  geometry.setAttribute("position", new THREE.BufferAttribute(vertexPositions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(vertexColorsData, 3));
  
  // Add normals for better lighting
  geometry.computeVertexNormals();
  
  return geometry;
};

/**
 * Creates and configures the Three.js renderer
 */
function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1);
  return renderer;
}

/**
 * Creates and configures the scene with lights
 */
function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Add ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, .5);
  scene.add(ambientLight);

  // Add point lights for better color reflection
  const pointLight1 = new THREE.PointLight(0xff0000, 1, 10);
  pointLight1.position.set(0, 1, 0);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xff0000, 1, 10);
  pointLight1.position.set(0,-1, 0);
  scene.add(pointLight2);
  // const pointLight2 = new THREE.PointLight(0xffffff, 1, 10);
  // pointLight2.position.set(1, 0, 0);
  // scene.add(pointLight2);

  // const pointLight3 = new THREE.PointLight(0xffffff, 1, 10);
  // pointLight3.position.set(-1, 0, 0);
  // scene.add(pointLight3);

  return scene;
}

/**
 * Creates and configures the camera
 */
function createCamera(): THREE.OrthographicCamera {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 2;
  return camera;
}

/**
 * Creates and configures the effect composer
 */
function createComposer(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.OrthographicCamera): EffectComposer {
  const composer = new EffectComposer(renderer);
  
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    CONFIG.BLOOM.STRENGTH,
    CONFIG.BLOOM.RADIUS,
    CONFIG.BLOOM.THRESHOLD
  );
  composer.addPass(bloomPass);

  return composer;
}

/**
 * Initializes the Three.js scene, renderer, camera, and a full-screen plane.
 */
export function setupThreeScene(element: HTMLElement): void {
  if (!element.shadowRoot) {
    element.attachShadow({ mode: 'open' });
  }
  element.shadowRoot!.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '-1';
  canvas.style.display = 'block';
  element.shadowRoot!.appendChild(canvas);

  const renderer = createRenderer(canvas);
  const scene = createScene();
  const camera = createCamera();
  const meshGroup = new THREE.Group();
  meshGroup.position.set(1, 0, 0);
  scene.add(meshGroup);

  const composer = createComposer(renderer, scene, camera);

  const threeContext: ThreeContext = {
    canvas,
    renderer,
    scene,
    camera,
    meshGroup,
    composer
  };

  const currentData = elementInstanceRegistry.get(element) || {};
  elementInstanceRegistry.set(element, { ...currentData, threeContext });

  handleResize(element);
}

/**
 * Updates the mesh group rotation based on delta time
 */
function updateMeshGroupRotation(meshGroup: THREE.Group, deltaTime: number): void {
  meshGroup.rotation.x += 0.2 * deltaTime * 3;
  meshGroup.rotation.y -= 0.2 * deltaTime;
}

/**
 * Handles shape creation and cleanup
 */
function handleShapeManagement(meshGroup: THREE.Group): void {
  if (shapesInAct.length < CONFIG.MAX_SHAPES) {
    const mesh = new THREE.Mesh(shapeGen(), sharedShapeMaterial);
    mesh.rotation.x = Math.random() * Math.PI * 2;
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.rotation.z = Math.random() * Math.PI * 2;
    meshGroup.add(mesh);
    meshGroup.scale.set(0.5, 0.5, 0.5);
    shapesInAct.push(mesh);
  } else {
    const delMesh = shapesInAct[0];
    shapesInAct.shift();
    if (delMesh.geometry) delMesh.geometry.dispose();
    if (delMesh.material) {
      const materials = Array.isArray(delMesh.material) ? delMesh.material : [delMesh.material];
      materials.forEach(material => {
        if ((material as THREE.MeshBasicMaterial).map) {
          (material as THREE.MeshBasicMaterial).map!.dispose();
        }
        material.dispose();
      });
    }
    meshGroup.remove(delMesh);
  }
}

/**
 * The animation loop.
 */
export function animate(element: HTMLElement, timestamp?: number): void {
  const data = elementInstanceRegistry.get(element);
  if (!element.isConnected || !data || !data.threeContext) return;

  const { renderer, scene, camera, meshGroup, composer } = data.threeContext;

  if (timestamp === undefined) {
    data.lastTimestamp = performance.now();
  } else {
    if (data.lastTimestamp === undefined) {
      data.lastTimestamp = timestamp;
    }
    const deltaTime = (timestamp - data.lastTimestamp) / 1000;
    
    updateMeshGroupRotation(meshGroup, deltaTime);
    data.lastTimestamp = timestamp;
  }

  composer.render();
  data.animationFrameId = requestAnimationFrame((ts) => animate(element, ts));
  elementInstanceRegistry.set(element, data);

  const elapsedTime = clock.getElapsedTime();
  if (elapsedTime - lastActionTime >= CONFIG.ACTION_INTERVAL) {
    console.log(`Action triggered at time: ${elapsedTime.toFixed(2)}s`);
    lastActionTime = elapsedTime;
    handleShapeManagement(meshGroup);
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

  cleanupEventListeners(element);

  // Clean up Three.js resources
  if (data.threeContext) {
    const { renderer, scene, composer } = data.threeContext;

    // Dispose of all meshes and their geometries/materials
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => {
            if ((material as THREE.MeshBasicMaterial).map) {
              (material as THREE.MeshBasicMaterial).map!.dispose();
            }
            material.dispose();
          });
        }
      }
    });

    // Dispose of the composer and its passes
    composer.passes.forEach(pass => {
      if (pass instanceof UnrealBloomPass) {
        pass.dispose();
      }
    });
    composer.dispose();

    // Dispose of the renderer
    renderer.dispose();

    // Clear the scene
    scene.clear();
  }

  // Clear the registry entry
  elementInstanceRegistry.delete(element);
}