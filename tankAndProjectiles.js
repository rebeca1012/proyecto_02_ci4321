import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { generateRotationMatrix } from './transformationAssistance';

export const projectileSpeed = 15;

//function for creating standart meshes of different colors
function makeInstance(geometry, color, pos) {
	const material = new THREE.MeshStandardMaterial({color});

	const instance = new THREE.Mesh(geometry, material);

	instance.position.copy(pos);

	return instance;
}

//Tank class with a constructor that takes color and position as arguments
export class Tank {
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

//Projectile class
export class Projectile {
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
export class parabolicProjectile extends Projectile {
	
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