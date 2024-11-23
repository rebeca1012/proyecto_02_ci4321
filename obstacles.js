import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// Function to create obstacle boxes
export function createObstacleBox(position, size) {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Front face
      -size.x/2, -size.y/2,  size.z/2,
       size.x/2, -size.y/2,  size.z/2,
       size.x/2,  size.y/2,  size.z/2,
      -size.x/2,  size.y/2,  size.z/2,
      // Back face
      -size.x/2, -size.y/2, -size.z/2,
      -size.x/2,  size.y/2, -size.z/2,
       size.x/2,  size.y/2, -size.z/2,
       size.x/2, -size.y/2, -size.z/2,
      // Top face
      -size.x/2,  size.y/2, -size.z/2,
      -size.x/2,  size.y/2,  size.z/2,
       size.x/2,  size.y/2,  size.z/2,
       size.x/2,  size.y/2, -size.z/2,
      // Bottom face
      -size.x/2, -size.y/2, -size.z/2,
       size.x/2, -size.y/2, -size.z/2,
       size.x/2, -size.y/2,  size.z/2,
      -size.x/2, -size.y/2,  size.z/2,
      // Right face
       size.x/2, -size.y/2, -size.z/2,
       size.x/2,  size.y/2, -size.z/2,
       size.x/2,  size.y/2,  size.z/2,
       size.x/2, -size.y/2,  size.z/2,
      // Left face
      -size.x/2, -size.y/2, -size.z/2,
      -size.x/2, -size.y/2,  size.z/2,
      -size.x/2,  size.y/2,  size.z/2,
      -size.x/2,  size.y/2, -size.z/2
    ]);
  
    const indices = new Uint16Array([
      0,  1,  2,  0,  2,  3,  // front
      4,  5,  6,  4,  6,  7,  // back
      8,  9,  10, 8,  10, 11, // top
      12, 13, 14, 12, 14, 15, // bottom
      16, 17, 18, 16, 18, 19, // right
      20, 21, 22, 20, 22, 23  // left
    ]);

    // uv coords
    const uvs = new Float32Array([
      0, 0,  1, 0,  1, 1,  0, 1, // front
      0, 0,  1, 0,  1, 1,  0, 1, // back
      0, 0,  1, 0,  1, 1,  0, 1, // top
      0, 0,  1, 0,  1, 1,  0, 1, // bottom
      0, 0,  1, 0,  1, 1,  0, 1, // right
      0, 0,  1, 0,  1, 1,  0, 1  // left
    ]);
  
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    // Create TextureLoader
    const textureLoader = new THREE.TextureLoader();
    
    // Load all textures
    const colorMap = textureLoader.load('../static/Wood049_1K-JPG_Color.jpg');
    const normalMap = textureLoader.load('../static/Wood049_1K-JPG_NormalGL.jpg');
    const roughnessMap = textureLoader.load('../static/Wood049_1K-JPG_Roughness.jpg');
    const displacementMap = textureLoader.load('../static/Wood049_1K-JPG_Displacement.jpg');
    
    // configure texture and repeat it
    const textures = [colorMap, normalMap, roughnessMap, displacementMap];
    textures.forEach(texture => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);
    });

    // Create material 
    const material = new THREE.MeshStandardMaterial({
        map: colorMap,
        normalMap: normalMap,
        roughnessMap: roughnessMap,
        displacementMap: displacementMap,
        displacementScale: 0.004, 
        normalScale: new THREE.Vector2(1, 1)
    });

    const box = new THREE.Mesh(geometry, material);
    box.position.copy(position);
    box.castShadow = true;
    box.receiveShadow = true;

    const boundingBox = new THREE.Box3().setFromObject(box);
    box.userData.boundingBox = boundingBox;
    return box;
}

// Function to create circular target
export function createCircularTarget(position, radius, depth) {
    const group = new THREE.Group();
    
    // Create rings
    const ringColors = [0xff0000, 0xffffff, 0xff0000, 0xffffff, 0xff0000];
    const ringRadii = [radius, radius * 0.8, radius * 0.6, radius * 0.4, radius * 0.2];
    
    for (let i = 0; i < ringRadii.length; i++) {
      const geometry = new THREE.BufferGeometry();
      const vertices = [];
      const indices = [];
      const segments = 32;
  
      for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * Math.PI * 2;
        const innerRadius = ringRadii[i] * 0.8;
        const outerRadius = ringRadii[i];
  
        vertices.push(
          Math.cos(theta) * innerRadius, Math.sin(theta) * innerRadius, depth / 2 + 0.001,
          Math.cos(theta) * outerRadius, Math.sin(theta) * outerRadius, depth / 2 + 0.001
        );
  
        if (j < segments) {
          const base = j * 2;
          indices.push(
            base, base + 1, base + 2,
            base + 1, base + 3, base + 2
          );
        }
      }
  
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
  
      const material = new THREE.MeshStandardMaterial({ color: ringColors[i], side: THREE.DoubleSide });
      const ring = new THREE.Mesh(geometry, material);
      group.add(ring);
    }
  
    // Create back of the target
    const backGeometry = new THREE.BufferGeometry();
    const backVertices = [];
    const backIndices = [];
    const segments = 32;
  
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      backVertices.push(
        Math.cos(theta) * radius, Math.sin(theta) * radius, 0,
        Math.cos(theta) * radius, Math.sin(theta) * radius, depth
      );
  
      if (i < segments) {
        const base = i * 2;
        backIndices.push(
          base, base + 1, base + 2,
          base + 1, base + 3, base + 2
        );
      }
    }
  
    backGeometry.setAttribute('position', new THREE.Float32BufferAttribute(backVertices, 3));
    backGeometry.setIndex(backIndices);
    backGeometry.computeVertexNormals();
  
    const backMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const back = new THREE.Mesh(backGeometry, backMaterial);
    group.add(back);
  
    group.position.copy(position);

    const boundingBox = new THREE.Box3().setFromObject(group);
    group.userData.boundingBox = boundingBox;

    return group;
}

