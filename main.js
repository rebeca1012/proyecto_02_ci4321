//import * as THREE from 'three';
//We import the three library for a CDN for it to work with VSCode Live Server
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { addFloor } from './floor';
import { addSky } from './sky'
import { createObstacleBox, createCircularTarget } from './obstacles';
import { generateRotationMatrix, generateTranslationMatrix } from './transformationAssistance';
import { Tank, Projectile, parabolicProjectile, projectileSpeed } from './tankAndProjectiles';
import { createCharacterSprite } from './graphicsUI';


//defining scene, camera and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

// Create a new scene for the GUI
const guiScene = new THREE.Scene();

// Create an orthographic camera for the GUI
const guiCamera = new THREE.OrthographicCamera(
    window.innerWidth / -2, window.innerWidth / 2,
    window.innerHeight / 2, window.innerHeight / -2,
    0.1, 10
);
guiCamera.position.z = 1;

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Create a simple text element for the GUI
// const guiText = createTextMesh("Lives: 3", 0xffffff);
// guiText.position.set(-window.innerWidth / 2 + 50, window.innerHeight / 2 - 50, 0);



// gui scene rendering test
const obstacleCounterArea = new THREE.Sprite(new THREE.SpriteMaterial({
    color: 0xFFC080,
    transparent: true,
    opacity: 1
}));
//width and height of the obstacle counter area
const ocAWidth = 250;
const ocAHeight = 50;
//offset of the obstacle counter area so it is not stuck to the borders
const ocAOffset = new THREE.Vector2(300, 25);


obstacleCounterArea.scale.set(ocAWidth, ocAHeight, 1);
obstacleCounterArea.position.set(-window.innerWidth / 2 + ocAWidth / 2 + ocAOffset.x, window.innerHeight / 2 - ocAHeight / 2 - ocAOffset.y, 0);

//guiScene.add(obstacleCounterArea);


//width and height of the obstacle counter area
const textWidth = 250;
const textHeight = 50;
//offset of the obstacle counter area so it is not stuck to the borders
const textOffset = new THREE.Vector2(25, 25);

// This dictionary is a patch because the mapping does not work properly
// maps the number I want to show to the character that will actually show it
// works for numbers 1 - 6
const numberMapping = {
	0: '0', 
	1: '1',
	2: '2',
	3: '3',
	4: '4',
	5: '5',
	6: '6'
};

// I will modify this later
let characterSprite
// Load the texture atlas
const textureLoader = new THREE.TextureLoader();
const numberTexture = textureLoader.load('./static/font8x7.png', () => {
	console.log('Texture loaded:', numberTexture);
    // Create and add character sprites to the GUI scene
    characterSprite = createCharacterSprite(numberMapping[5], numberTexture); // Example: create sprite for character 'A'
    characterSprite.position.set(-window.innerWidth / 2 + textWidth / 2 + textOffset.x, window.innerHeight / 2 - textHeight / 2 - textOffset.y, 0);
    guiScene.add(characterSprite);
},
undefined,
(error) => {
	console.error('Error loading texture atlas:', error);
});

//defining lights: directional light
const lightColor = 0xFFFFFF;
const lightIntensity = 0.5; 
const light = new THREE.DirectionalLight(lightColor, lightIntensity);
light.position.set(1, 4, 3); //the target remains at (0, 0, 0)
scene.add(light);

//defining spotlight to test that normal maps are working
const movingLight = new THREE.SpotLight(lightColor, lightIntensity);
movingLight.position.set(0, 6.5, -1.5);
movingLight.target.position.set(0, 0, -1.5);
movingLight.angle = Math.PI / 6; // Adjust the angle to control the spread of the light
movingLight.penumbra = 0.1; // Adjust the penumbra to soften the edges of the light
movingLight.castShadow = true; // Enable shadows for the SpotLight
scene.add(movingLight);
scene.add(movingLight.target);

//ambient light: white light, 50% intensity
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
scene.add(ambientLight);

//Projectile pooling
const projectiles = [];

//creating tank, assigning tank color and base position
const tankColor = 0x5B53FF; 
const tankBasePosition = new THREE.Vector3(0, 0, 0);
//const tank = makeTank(tankColor, tankBasePosition);
const completeTank = new Tank(tankColor, tankBasePosition);
const tank = completeTank.tankBase;

scene.add(tank);

// create and add obstacles
const obstacles = [];
const obstacle1 = createObstacleBox(new THREE.Vector3(3, 0., 0), new THREE.Vector3(1.0, 1.0, 1.0));
const obstacle2 = createObstacleBox(new THREE.Vector3(-3, 0, 0), new THREE.Vector3(1.0, 1.0, 1.0));
const obstacle3 = createObstacleBox(new THREE.Vector3(0, 0, -4), new THREE.Vector3(2.0, 1.0, 1.0));

scene.add(obstacle1);
obstacles.push(obstacle1);
scene.add(obstacle2);
obstacles.push(obstacle2);
scene.add(obstacle3);
obstacles.push(obstacle3);

// Creating and adding circular targets
const target1 = createCircularTarget(new THREE.Vector3(4, 2, -3), 0.5, 0.1);
const target2 = createCircularTarget(new THREE.Vector3(-4, 4, -3), 0.5, 0.1);

scene.add(target1);
obstacles.push(target1);
scene.add(target2);
obstacles.push(target2);

// Add the floor to the scene
addFloor(scene);
addSky(scene, renderer, camera);

camera.position.set(0, 3, 5);
camera.lookAt(0, 0, 0);

//Handling events
//Inputs by polling
const keys = {
	ArrowUp: false, //vehicle movement
	ArrowDown: false,
	ArrowLeft: false,
	ArrowRight: false,
	KeyW: false,  //turret movement
	KeyA: false,
	KeyS: false,
	KeyD: false,
	Space: false, //shoot
	KeyQ: false, //switch weapon
	KeyE: false
};
// weapons
const weapons = ["standard", "parabolic"];
let index = 0;

//Switching variables
let lastSwitchTime = 0;
const switchCooldown = 500; // Cooldown duration in milliseconds

// Cooldown variables
let lastShotTime = 0;
const shotCooldown = 750; // Cooldown duration in milliseconds

//Input listener
window.addEventListener('keydown', (event) => {
	if (keys.hasOwnProperty(event.code)) {
		keys[event.code] = true;
	}
});

window.addEventListener('keyup', (event) => {
	if (keys.hasOwnProperty(event.code)) {
		keys[event.code] = false;
	}
});

//Input Handling
const tankPivot = tank.children[0].children[0];
const tankTurretEnd = tankPivot.children[0].children[0];

const rotationSpeed = 1;
const movementSpeed = 1;

function handleInput(deltaTime) {

	if (keys.KeyD) {

		//generate a rotation matrix for the pivot around the parents' Y axis
		
			const composedTransformation = generateRotationMatrix(new THREE.Vector3(0, 1, 0), tankPivot, - rotationSpeed * deltaTime, false);

			// Apply the composed transformation to the tankPivot
			tankPivot.applyMatrix4(composedTransformation);
		
	}
	else if (keys.KeyA) {
		//generate a rotation matrix for the pivot around the parents' Y axis
		tankPivot.applyMatrix4(generateRotationMatrix(new THREE.Vector3(0, 1, 0), tankPivot, rotationSpeed * deltaTime, false));
	
	}

	if (keys.KeyW) {
		const pivotYAxis = new THREE.Vector3();

		// Get the direction of its local Y axis to apply bounds to it
		tankPivot.matrixWorld.extractBasis(new THREE.Vector3(), pivotYAxis, new THREE.Vector3());
		if (pivotYAxis.y < 0.7) {

		//generate a rotation matrix for the pivot around its local X axis
		const composedTransformation = generateRotationMatrix(new THREE.Vector3(1, 0, 0), tankPivot, rotationSpeed * deltaTime, true);

		// Apply the composed transformation to the tankPivot
		tankPivot.applyMatrix4(composedTransformation);
		}
		else console.log("You're trying to go too high!");

	}
	else if (keys.KeyS) {
		const pivotYAxis = new THREE.Vector3();

		// Get the direction of its local Y axis
		tankPivot.matrixWorld.extractBasis(new THREE.Vector3(), pivotYAxis, new THREE.Vector3());
		if (pivotYAxis.y >= -0.1) {

		//generate a rotation matrix for the pivot around its local X axis and apply it
		tankPivot.applyMatrix4(generateRotationMatrix(new THREE.Vector3(1, 0, 0), tankPivot, - rotationSpeed * deltaTime, true));
		}	else console.log("You are trying to go too low!");
	}
	
	if (keys.ArrowRight) {
		//generate a rotation matrix for the tank around the around its Y axis
		const composedTransformation = generateRotationMatrix(new THREE.Vector3(0, 1, 0), tank, - rotationSpeed * deltaTime, true);
		//apply the rotation 
		tank.applyMatrix4(composedTransformation);

	}
	else if (keys.ArrowLeft) {
		//generate a rotation matrix for the tank around the around its Y axis and apply it
		tank.applyMatrix4(generateRotationMatrix(new THREE.Vector3(0, 1, 0), tank, rotationSpeed * deltaTime, true));
	}

	if (keys.ArrowUp) {
		//tank.position.z += 0.1 * deltaTime;
		tank.applyMatrix4(generateTranslationMatrix(new THREE.Vector3(0, 0, 1), tank, - movementSpeed * deltaTime, true));
	}
	else if (keys.ArrowDown) {
		//tank.position.z -= 0.1 * deltaTime;
		tank.applyMatrix4(generateTranslationMatrix(new THREE.Vector3(0, 0, 1), tank, movementSpeed * deltaTime, true));
	}

	if (keys.Space){
		const currentTime = Date.now();
		if (currentTime - lastShotTime > shotCooldown) {

		const firingPoint = new THREE.Vector3();
		tankTurretEnd.getWorldPosition(firingPoint);
		
		const firingDirection = new THREE.Vector3();
		tankTurretEnd.getWorldDirection(firingDirection);

		//We need to rotate the firingDirection to match the turret's rotation

		//Create and Fire projectile from the firing point
		fireProjectile(firingPoint, firingDirection);

		lastShotTime = currentTime;
		}
	}

	if (keys.KeyQ) {
		
		const currentTime = Date.now();
		if (currentTime - lastSwitchTime > switchCooldown) {
			index = (index - 1) % weapons.length;
			if (index < 0) index = weapons.length - 1;

			console.log("Switching to weapon:", weapons[index]);
			lastSwitchTime = currentTime;
		}
	}

	if (keys.KeyE) {
		const currentTime = Date.now();
		if (currentTime - lastSwitchTime > switchCooldown) {
			index = (index + 1) % weapons.length;
			console.log("Switching to weapon:", weapons[index]);
			lastSwitchTime = currentTime;
		}
	}
}

function fireProjectile(position, direction) {

	const maxProjectiles = 5;

	// If there are too many projectile, delete the oldest one
	if (projectiles.length >= maxProjectiles) {
		const projectile = projectiles.shift();
		scene.remove(projectile.mesh);
	}

	// Create a new projectile and add it to the scene
	let projectile;

	switch (index) {
		case 0:
			projectile = new Projectile(position, direction, projectileSpeed);
			break;
		case 1:
			projectile = new parabolicProjectile(position, direction, projectileSpeed);
			break;
	}

	scene.add(projectile.mesh);
	projectiles.push(projectile);
}

//speed of the spotlight that updates over time inside the next function
let movingLightSpeed = Math.PI/2;
//this function updates elements that dont require user input to work
function updateElements(deltaTime){

	//projectiles
	projectiles.forEach(projectile => {
		projectile.update(deltaTime);
	});

	//collision detection (this is one of the codes of all time)
	projectiles.forEach(projectile => {
		obstacles.forEach(obstacle => {
			if (obstacle.userData.boundingBox.intersectsBox(projectile.boundingBox)) {
				//remove projectile
				scene.remove(projectile.mesh);
				projectiles.splice(projectiles.indexOf(projectile), 1);

				//remove obstacle
				scene.remove(obstacle);
				obstacles.splice(obstacles.indexOf(obstacle), 1);

				//update obstacle counter
				guiScene.remove(characterSprite);
				characterSprite = createCharacterSprite(numberMapping[obstacles.length], numberTexture);
				characterSprite.position.set(-window.innerWidth / 2 + textWidth / 2 + textOffset.x, window.innerHeight / 2 - textHeight / 2 - textOffset.y, 0);
				guiScene.add(characterSprite);
			}
		});
	});

	//constant movement of the spotlight
	const lightMovement = Math.sin(movingLightSpeed) / 7; // Adjust the multipliar to control the range of movement
	movingLightSpeed += deltaTime * 0.5; // Adjust the multiplier to control the speed

	// Apply the new position to the spotlight's target
	// movingLight.target.position.set(targetX, 0, movingLight.target.position.z);
	// movingLight.target.updateMatrixWorld(); // Ensure the target's matrix is updated
	movingLight.target.position.applyMatrix4(generateTranslationMatrix(new THREE.Vector3(1, 0, 0), movingLight.target, lightMovement, true));


}
//render and animation function
let then = 0;

function render(now) {
	now *= 0.001;  // convert time to seconds
	const deltaTime = now - then;
	then = now;

	handleInput(deltaTime);
	
	//things that dont require input
	updateElements(deltaTime);
	
	// Render Main Scene
	renderer.render( scene, camera );
	renderer.autoClear = false; // Prevent clearing the renderer automatically (dont clear the main scene)
	// Render the GUI scene

    renderer.clearDepth(); // Clear the depth buffer (make sure the GUI is on top)
    renderer.render(guiScene, guiCamera);

	requestAnimationFrame(render);

}
requestAnimationFrame(render);