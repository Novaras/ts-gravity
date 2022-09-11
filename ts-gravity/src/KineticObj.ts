import { Vec } from "./Vec";

export const massToRadius = (mass: number) => mass / 80;

export default class KineticObj {
	constructor(
		private _mass: number, private _pos: Vec, private _velocity: Vec, private _id: string
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
		return Vec.mulScalar(this._velocity, this.mass);
	}

	get next_pos() {
		return Vec.add(this._pos, this._velocity);
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

	setPos(pos: [number, number]) {
		this._pos = pos;
	}

	setVelocity(velocity: [number, number]) {
		this._velocity = velocity;
	}

	// -- modifiers

	accelerate(accel_vec: Vec) {
		this._velocity = Vec.add(this._velocity, accel_vec);
	}

	ghost(duration: number) {
		this._unghost_age = this.age + duration;
		this._ghosted = true;
	}

	// call this each frame
	update() {
		this._radius = massToRadius(this.mass);
		this._pos = Vec.add(this._pos, this._velocity);
		this._age += 1;
		if (this._unghost_age && this._unghost_age <= this.age) {
			this._unghost_age = undefined;
			this._ghosted = false;
		}
	}
}
