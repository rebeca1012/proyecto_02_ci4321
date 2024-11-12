import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export function addSky(scene, renderer, camera) {
  // Create TextureLoader
  const loader = new THREE.TextureLoader();

  const texture = loader.load('./static/sky.jpg', () => {
    renderer.render(scene, camera);
  });
  
  // sphere for the sky
  const geometry = new THREE.SphereGeometry(500, 60, 40);

  // Material with texture
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.BackSide, // Render the inside of the sphere
  });

  // mesh
  const sky = new THREE.Mesh(geometry, material);

  // Add sky to the scene 
  scene.add(sky);
}