
// --- SHADER CODE (as defined above) ---
export const vertexShader = `
  attribute vec3 color;
  varying vec3 vColor;
  void main() {
    vColor = color;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vColor;
  void main() {
    vec3 finalColor = vColor * uIntensity;
    // Example: make it pulse slightly for more dynamism
    // finalColor *= (0.8 + sin(uTime * 2.0 + length(vColor) * 5.0) * 0.2);
    gl_FragColor = vec4(finalColor, 0.6); // Keep original opacity
  }
`;
// --- END SHADER CODE ---
