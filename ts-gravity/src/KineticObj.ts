import Vec2, { Vec2Castable } from "./Vec2";
import * as Physics from './PhysicsLib';

export const massToRadius = (mass: number) => mass > 10000 ? 1 + Math.pow(mass, 0.5) : mass / 150;

export default class KineticObj {
	constructor(
		private _mass: number, private _pos: Vec2, private _velocity: Vec2, private _id: string
	) {
		this._age = 0;
		this._radius = massToRadius(this.mass);
		this._ghosted = false;
	}

	static GROWTH_EXPONENT = 1 / 2;

	private _radius: number;
	private _age: number;
	private _unghost_age?: number;
	private _ghosted: boolean;

	// -- getters

	get id() {
		return this._id;
	}

	get age() {
		return this._age;
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
		return new Vec2(this._pos.x + this._velocity.x, this._pos.y + this._velocity.y);
	}

	get radius() {
		return this._radius;
	}

	get ghosted() {
		return this._ghosted;
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

	accelerate(accel_vec: Vec2Castable) {
		this.velocity.add(accel_vec);
		return this;
	}

	impulse(force_scalar: number, theta: number) {
		const accel_scalar = force_scalar / this.mass;
		const accel_vec = Physics.scalarHypToVec(accel_scalar, theta);
		this.accelerate(accel_vec);
		return this;
	}

	ghost(duration: number) {
		this._unghost_age = this.age + duration;
		this._ghosted = true;
	}

	// call this each frame
	update() {
		this._radius = massToRadius(this.mass);
		this._pos.add(this.velocity);
		this._age += 1;
		if (this._unghost_age && this._unghost_age <= this.age) {
			this._unghost_age = undefined;
			this._ghosted = false;
		}
	}
}
