/**
 * Declaration file for Three.js
 * This resolves TypeScript warnings when importing the Three.js module
 */
declare module 'three' {
  export class Color {
    constructor(color: string | number);
  }
  
  // Add other Three.js types as needed
  export const Object3D: any;
  export const Scene: any;
  export const WebGLRenderer: any;
  export const PerspectiveCamera: any;
  export const Vector3: any;
  export const Raycaster: any;
  export const Mesh: any;
  export const BoxGeometry: any;
  export const MeshBasicMaterial: any;
  export const DirectionalLight: any;
  export const AmbientLight: any;
} 