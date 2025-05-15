// File: libs/three-background/src/three-logic.ts
import * as THREE from 'three';

// Interface for the data we'll store in our WeakMap per element
interface ElementInstanceData {
  animationFrameId?: number;
  resizeHandler?: () => void;
  threeContext?: ThreeContext; // Holds all Three.js related objects
}

// Interface for the Three.js context associated with an element
interface ThreeContext {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  planeMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.Material | THREE.Material[]>; // Or more specific material
  // Example for shader material if you go that route:
  // shaderMaterial?: THREE.ShaderMaterial;
}

// WeakMap to store all data associated with an element instance
const elementInstanceRegistry = new WeakMap<HTMLElement, ElementInstanceData>();

/**
 * Initializes the Three.js scene, renderer, camera, and a full-screen plane.
 * @param element - The custom element instance (ThreeBackgroundWC).
 */
export function setupThreeScene(element: HTMLElement): void {
  if (!element.shadowRoot) {
    element.attachShadow({ mode: 'open' });
  }
  // Clear previous content ensuring shadowRoot is not null
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

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  const planeGeometry = new THREE.PlaneGeometry(2, 2);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(element.getAttribute('bgColor') || '#111000'), // Default dark blue/purple
  });
  const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  scene.add(planeMesh);

  const threeContext: ThreeContext = {
    canvas,
    renderer,
    scene,
    camera,
    planeMesh,
  };

  // Store context and other data in the registry
  const currentData = elementInstanceRegistry.get(element) || {};
  elementInstanceRegistry.set(element, { ...currentData, threeContext });

  handleResize(element); // Initial size adjustment
}

/**
 * The animation loop.
 * @param element - The custom element instance.
 */
export function animate(element: HTMLElement): void {
  const data = elementInstanceRegistry.get(element);
  if (!element.isConnected || !data || !data.threeContext) return;

  const { renderer, scene, camera } = data.threeContext;

  // Example: Update shader uniforms time
  // const { shaderMaterial } = data.threeContext;
  // if (shaderMaterial && shaderMaterial.uniforms.uTime) {
  //   shaderMaterial.uniforms.uTime.value = performance.now() / 1000;
  // }

  renderer.render(scene, camera);

  data.animationFrameId = requestAnimationFrame(() => animate(element));
  elementInstanceRegistry.set(element, data); // Re-set to save animationFrameId
}

/**
 * Handles window resize events.
 * @param element - The custom element instance.
 */
export function handleResize(element: HTMLElement): void {
  const data = elementInstanceRegistry.get(element);
  if (!data || !data.threeContext || !element.isConnected) return;

  const { renderer, camera } = data.threeContext;
  const newWidth = window.innerWidth;
  const newHeight = window.innerHeight;

  renderer.setSize(newWidth, newHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const aspect = newWidth / newHeight;
  if (aspect >= 1) {
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
  } else {
    camera.left = -1;
    camera.right = 1;
    camera.top = 1 / aspect;
    camera.bottom = -1 / aspect;
  }
  camera.updateProjectionMatrix();

  // If using ShaderMaterial with resolution uniform:
  // const { shaderMaterial } = data.threeContext;
  // if (shaderMaterial && shaderMaterial.uniforms.uResolution) {
  //   shaderMaterial.uniforms.uResolution.value.set(newWidth, newHeight);
  // }
}

/**
 * Sets up event listeners (e.g., resize).
 * @param element - The custom element instance.
 */
export function setupEventListeners(element: HTMLElement): void {
  const specificResizeHandler = () => handleResize(element);
  const currentData = elementInstanceRegistry.get(element) || {};
  currentData.resizeHandler = specificResizeHandler;
  elementInstanceRegistry.set(element, currentData);

  window.addEventListener('resize', specificResizeHandler);
}

/**
 * Cleans up event listeners.
 * @param element - The custom element instance.
 */
function cleanupEventListeners(element: HTMLElement): void {
  const data = elementInstanceRegistry.get(element);
  if (data && data.resizeHandler) {
    window.removeEventListener('resize', data.resizeHandler);
    delete data.resizeHandler;
    // No need to set if we are about to delete the whole entry or parts of it.
  }
}

/**
 * Cleans up Three.js resources and stops animation.
 * @param element - The custom element instance.
 */
export function cleanupThreeResources(element: HTMLElement): void {
  const data = elementInstanceRegistry.get(element);
  if (!data) return;

  if (data.animationFrameId) {
    cancelAnimationFrame(data.animationFrameId);
    delete data.animationFrameId;
  }

  if (data.threeContext) {
    const { renderer, scene, planeMesh, canvas } = data.threeContext;

    if (planeMesh) {
      if (planeMesh.geometry) planeMesh.geometry.dispose();
      if (planeMesh.material) {
        // Handle single material or array of materials
        const materials = Array.isArray(planeMesh.material) ? planeMesh.material : [planeMesh.material];
        materials.forEach(material => {
          if ((material as THREE.MeshBasicMaterial).map) { // Example for texture
            (material as THREE.MeshBasicMaterial).map!.dispose();
          }
          material.dispose();
        });
      }
      scene.remove(planeMesh);
    }

    // General cleanup for scene objects (if more are added later)
    // scene.traverse((object) => {
    //   if ((object as THREE.Mesh).isMesh) {
    //     const mesh = object as THREE.Mesh;
    //     if (mesh.geometry) mesh.geometry.dispose();
    //     if (mesh.material) {
    //       const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    //       materials.forEach(mat => mat.dispose());
    //     }
    //   }
    // });

    if (renderer) renderer.dispose();
    if (canvas && canvas.parentNode) { // Ensure canvas exists and has a parent
        canvas.parentNode.removeChild(canvas);
    }
    if (element.shadowRoot) {
        element.shadowRoot.innerHTML = '';
    }
    delete data.threeContext;
  }

  cleanupEventListeners(element);

  // Optionally, remove the element's entry from the registry if it's fully cleaned up
  // However, WeakMap handles garbage collection when the element itself is GC'd.
  // If the element might be re-connected, keeping some parts of 'data' might be desired.
  // For full cleanup on disconnect:
  // elementInstanceRegistry.delete(element);
}

/**
 * Updates the material of the plane based on attributes.
 * @param element - The custom element instance.
 * @param name - The name of the attribute that changed.
 * @param newValue - The new value of the attribute.
 */
export function updateMaterialFromAttributes(element: HTMLElement, name: string, newValue: string | null): void {
    const data = elementInstanceRegistry.get(element);
    if (!data || !data.threeContext || newValue === null) return;

    const { planeMesh } = data.threeContext;

    if (planeMesh && planeMesh.material && !(Array.isArray(planeMesh.material))) { // Assuming single material for simplicity
        const material = planeMesh.material as THREE.MeshBasicMaterial; // Cast to the specific type you're using
        if (name === 'bgColor' && material.color) {
            material.color.set(newValue);
        }
        // Add more attribute handling here, e.g., for shader uniforms
        // if (name === 'color1' && data.threeContext.shaderMaterial?.uniforms.uColor1) {
        //   data.threeContext.shaderMaterial.uniforms.uColor1.value.set(newValue);
        // }
    }
}
