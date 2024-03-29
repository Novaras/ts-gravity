import Vec2 from "./Vec2";
import * as Physics from './PhysicsLib';

export default class KineticObj {
	constructor(
		private _mass: number, private _pos: Vec2, private _velocity: Vec2, private _id: string
	) { }

	// -- getters

	get id() {
		return this._id;
	}

	get mass() {
		return this._mass;
	}

	get pos() {
		return this._pos;
	}

	get velocity() {
		return this._velocity;
	}

	get momentum() {
		return new Vec2(this._velocity.x, this._velocity.y).multiply(this.mass);
	}

	get next_pos() {
		return new Vec2(this._pos.x, this._pos.y).add(this.velocity);
	}

	get radius() {
		return this.mass / 150;
	}

	// -- setters

	setId(id: string) {
		this._id = id;
	}

	setMass(mass: number) {
		this._mass = mass;
	}

	setPos(pos: Vec2) {
		this._pos = pos;
	}

	setVelocity(velocity: Vec2) {
		this._velocity = velocity;
	}

	// -- modifiers

	accelerate(accel_vec: Vec2) {
		this.velocity.add(accel_vec);
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
		this._pos.add(this.velocity);
	}
}
