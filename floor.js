import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export function addFloor(scene) {
  // Create TextureLoader
  const loader = new THREE.TextureLoader();

  const texture = loader.load('../static/dustyGround.png');
  
  // repeat texture so it doesn't look pixelated and terrible
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);

  // Plan geometry
  const geometry = new THREE.PlaneGeometry(100, 100);

  // Material with texture
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide
  });

  // mesh
  const floor = new THREE.Mesh(geometry, material);

  // horizontal floor
  floor.rotation.x = -Math.PI / 2;

  // floor beneath tank 
  floor.position.y = -0.5;

  // Add floor to the scene 
  scene.add(floor);
}