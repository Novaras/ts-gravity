import Vec2 from "./Vec2";
import * as Physics from './Physics';

export default class KineticObj {
	constructor(
		private _mass: number, private _pos: Vec2, private _speed: Vec2
	) { }

	// -- getters

	get mass() {
		return this._mass;
	}

	get pos() {
		return this._pos;
	}

	get speed() {
		return this._speed;
	}

	// -- setters

	setMass(mass: number) {
		this._mass = mass;
	}

	setPos(pos: Vec2) {
		this._pos = pos;
	}

	setSpeed(speed_vec: Vec2) {
		this._speed = speed_vec;
	}

	// -- modifiers

	accelerate(accel_vec: Vec2) {
		this.speed.add(accel_vec);
		return this;
	}

	impulse(force_scalar: number, theta: number) {
		const accel_scalar = force_scalar / this.mass;
		const accel_vec = Physics.scalarHypToVec(accel_scalar, theta);
		this.accelerate(accel_vec);
		return this;
	}

	// call this each frame
	update() {
		this._pos.add(this.speed);
	}
}
