//import * as THREE from 'three';
//We import the three library for a CDN for it to work with VSCode Live Server
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { addFloor } from './floor';
import { addSky } from './sky'
import { createObstacleBox, createCircularTarget } from './obstacles';
//defining scene, camera and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

//defining lights: directional light
const lightColor = 0xFFFFFF;
const lightIntensity = 1; 
const light = new THREE.DirectionalLight(lightColor, lightIntensity);
light.position.set(1, 4, 3); //the target remains at (0, 0, 0)
scene.add(light);

//ambient light: white light, 50% intensity
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
scene.add(ambientLight);


//function for creating standart meshes of different colors
function makeInstance(geometry, color, pos) {
	const material = new THREE.MeshStandardMaterial({color});

	const instance = new THREE.Mesh(geometry, material);

	instance.position.copy(pos);

	return instance;
}

//Projectile class
class Projectile {
	// the projectile will be a standart sphere with the specified
	//position, direction and speed
	constructor(position, direction, speed) {

		const geometry = new THREE.SphereGeometry(0.075, 8, 8);
		const material = new THREE.MeshStandardMaterial({color: 0xC0C0C0});
		this.mesh = new THREE.Mesh(geometry, material);

		this.mesh.position.copy(position);
		this.velocity = direction.normalize().multiplyScalar(speed);

		//adding a bounding box for collision detection
		this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
	}

	//function to update the projectile position
	update(deltaTime) {
		// position += velocity*time
		this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
		this.boundingBox.setFromObject(this.mesh);
	}
}
class parabolicProjectile extends Projectile {
	
	//We will use these to calculate the speed of the parabolic
	//projectile at any given time
	gravityAccel = - projectileSpeed/300;
	initialVerticalSpeed;
	initialTime;

	constructor(position, direction, speed) {
		super(position, direction, speed);
		//initial parameters for vertical yeet
		this.initialVerticalSpeed = this.velocity.y;
		this.initialTime = Date.now();
	}

	update(deltaTime) {
		const currentTime = Date.now();
		
		// vy = v0 + at, vx is the same as standart projectile
		const movement = new THREE.Matrix4().makeTranslation(
			this.velocity.x * deltaTime,
			(this.initialVerticalSpeed + this.gravityAccel*(currentTime - this.initialTime))*deltaTime,
			0
		)
		this.mesh.applyMatrix4(movement);
		this.boundingBox.setFromObject(this.mesh);

	}
}

//Projectile pooling
const projectiles = [];

class Tank {
	constructor(tankColor, tankBasePosition){
		//creating a rectangular tank base
		const baseGeometry = new THREE.BoxGeometry( 2, 1, 2);
		//creating a platform on top for more turret range of movement
		const platformGeometry = new THREE.CylinderGeometry(0.75, 0.75, 0.6, 16);
		//creating a sphere for the turret base
		const tankPivotGeometry = new THREE.SphereGeometry(0.75,32,16);
		//creating cilinder for the turret
		const turretGeometry = new THREE.CylinderGeometry(0.18, 0.18, 1.3, 16);
	
		//creating respective meshes
		//each position will be relative to its parent in the scenegraph
		this.tankBase = makeInstance(baseGeometry, tankColor, tankBasePosition);
		this.tankPlatform = makeInstance(platformGeometry, tankColor, {x:0, y:0.6, z:0});
		this.tankPivot = makeInstance(tankPivotGeometry, tankColor, {x:0, y:0.6, z:0});
		this.tankTurret = makeInstance(turretGeometry,tankColor, {x: 0, y: 0.5, z: 0});
	
		//mounting point for projectile firing
		//const turretEnd = makeInstance(new THREE.SphereGeometry(0.05, 8, 8), 0x00ff00, {x: 0, y: 0.65, z: 0});
		this.turretEnd = new THREE.Object3D();
		this.turretEnd.position.set(0, 0.65, 0);
	
		//rotating the pivot so initially the turret will be parallel to the ground
		const initialRotationMatrix = generateRotationMatrix(new THREE.Vector3(1, 0, 0), this.tankPivot, -Math.PI / 2, true);
		this.tankPivot.applyMatrix4(initialRotationMatrix);
		
		//compensating the previous rotation in the mounting point for
		//correct projectile firing
		const rotationMatrix = generateRotationMatrix(new THREE.Vector3(1, 0, 0), this.turretEnd, -Math.PI / 2, true);
		this.turretEnd.applyMatrix4(rotationMatrix);
		
		this.tankTurret.add(this.turretEnd);
	
		// putting the scenegraph (tree) together
		this.tankPivot.add(this.tankTurret);
		this.tankPlatform.add(this.tankPivot)
		this.tankBase.add(this.tankPlatform);
	
		this.tankBase.pivot = this.tankPivot; // I want to access once the tank is made

	}
}	

//function that creates a basic tank of the specified color in the specified position
function makeTank(tankColor, tankBasePosition){
	//creating a rectangular tank base
	const baseGeometry = new THREE.BoxGeometry( 2, 1, 2);
	//creating a platform on top for more turret range of movement
	const platformGeometry = new THREE.CylinderGeometry(0.75, 0.75, 0.6, 16);
	//creating a sphere for the turret base
	const tankPivotGeometry = new THREE.SphereGeometry(0.75,32,16);
	//creating cilinder for the turret
	const turretGeometry = new THREE.CylinderGeometry(0.18, 0.18, 1.3, 16);

	//creating respective meshes
	//each position will be relative to its parent in the scenegraph
	const tankBase = makeInstance(baseGeometry, tankColor, tankBasePosition);
	const tankPlatform = makeInstance(platformGeometry, tankColor, {x:0, y:0.6, z:0});
	const tankPivot = makeInstance(tankPivotGeometry, tankColor, {x:0, y:0.6, z:0});
	const tankTurret = makeInstance(turretGeometry,tankColor, {x: 0, y: 0.5, z: 0});

	//mounting point for projectile firing
	//const turretEnd = makeInstance(new THREE.SphereGeometry(0.05, 8, 8), 0x00ff00, {x: 0, y: 0.65, z: 0});
	const turretEnd = new THREE.Object3D();
	turretEnd.position.set(0, 0.65, 0);

	//rotating the pivot so initially the turret will be parallel to the ground
	const initialRotationMatrix = generateRotationMatrix(new THREE.Vector3(1, 0, 0), tankPivot, -Math.PI / 2, true);
	tankPivot.applyMatrix4(initialRotationMatrix);
	
	//compensating the previous rotation in the mounting point for
	//correct projectile firing
	const rotationMatrix = generateRotationMatrix(new THREE.Vector3(1, 0, 0), turretEnd, -Math.PI / 2, true);
	turretEnd.applyMatrix4(rotationMatrix);
	
	tankTurret.add(turretEnd);

	// putting the scenegraph (tree) together
	tankPivot.add(tankTurret);
	tankPlatform.add(tankPivot)
	tankBase.add(tankPlatform);

	tankBase.pivot = tankPivot; // I want to access once the tank is made

	return tankBase;
}
  

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

camera.position.z = 5;
camera.position.y = 1;

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
const projectileSpeed = 15;

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

function generateRotationMatrix(axis, element, angle, localRotation) {

	if (localRotation) {
		//applying the quaternion to the axis of rotation (global) returns the axis of the element
		axis = axis.applyQuaternion(element.quaternion).normalize();
	} 

	// Create a translation matrix to move the element to the origin before applying rotation
	const translationToOrigin = new THREE.Matrix4().makeTranslation(
		-element.position.x,
		-element.position.y,
		-element.position.z
	)
	// Create a translation matrix to move the element back to its original position after rotating
	const translationBack = new THREE.Matrix4().makeTranslation(
		element.position.x,
		element.position.y,
		element.position.z
	)
	// Generates the rotation matrix
	const rotation = new THREE.Matrix4().makeRotationAxis(axis, angle);
	//console.log("Rotation Matrix:", rotation.elements);

	// Composes everything to return the rotation (+ translation) matrix to use
	return new THREE.Matrix4()
		.multiply(translationBack)
		.multiply(rotation)
		.multiply(translationToOrigin);

}

function generateTranslationMatrix(direction, element, distance, localCoordinates) {

	if (localCoordinates) {
		direction = direction.applyQuaternion(element.quaternion).normalize();
	}
	const translation = new THREE.Matrix4().makeTranslation(distance * direction.x, distance * direction.y, distance * direction.z);
	//console.log("translation Matrix:", translation.elements);

	// Create a rotation matrix around the local y-axis
	return new THREE.Matrix4()
		.multiply(translation)
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
			}
		});
	});


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

	renderer.render( scene, camera );
	
	requestAnimationFrame(render);

}
requestAnimationFrame(render);