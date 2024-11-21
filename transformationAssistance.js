import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export function generateRotationMatrix(axis, element, angle, localRotation) {

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

export function generateTranslationMatrix(direction, element, distance, localCoordinates) {

	if (localCoordinates) {
		direction = direction.applyQuaternion(element.quaternion).normalize();
	}
	const translation = new THREE.Matrix4().makeTranslation(distance * direction.x, distance * direction.y, distance * direction.z);
	//console.log("translation Matrix:", translation.elements);

	// Create a rotation matrix around the local y-axis
	return new THREE.Matrix4()
		.multiply(translation)
}