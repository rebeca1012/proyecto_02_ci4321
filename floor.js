import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export function addFloor(scene) {
  // Create TextureLoader
  const loader = new THREE.TextureLoader();
  
  function onError(err) {
    console.error('An error occurred loading the texture:', err);
  }

  // Load all textures
  const colorMap = loader.load('./static/Ground080_1K-JPG_Color.jpg', undefined, undefined, onError);
  const normalMap = loader.load('./static/Ground080_1K-JPG_NormalGL.jpg', undefined, undefined, onError);
  const roughnessMap = loader.load('./static/Ground080_1K-JPG_Roughness.jpg', undefined, undefined, onError);
  const aoMap = loader.load('./static/Ground080_1K-JPG_AmbientOcclusion.jpg', undefined, undefined, onError);
  
  // configure texture and repeat so it doesn't look pixelated and terrible
  const textures = [colorMap, normalMap, roughnessMap, aoMap];
  textures.forEach(texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
  });

  // Plane geometry
  const geometry = new THREE.PlaneGeometry(200, 200);

  // Material with all texture maps
  const material = new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap: normalMap,
    roughnessMap: roughnessMap,
    aoMap: aoMap,
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

  console.log('Floor added to the scene');
}

