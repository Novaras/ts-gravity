import { Vec } from "./Vec";

export const massToRadius = (mass: number) => Math.round(mass / 80);

export default class KineticObj {
	constructor(
		private _mass: number, private _pos: Vec, private _velocity: Vec, private _id: string
	) {
		this._age = 0;
		this._radius = massToRadius(this.mass);
		this._ghosted = false;
		this._fixed = false;
		this._mergeable = true;
	}

	static GROWTH_EXPONENT = 1 / 2;

	private _radius: number;
	private _age: number;
	private _unghost_age?: number;
	private _ghosted: boolean;
	private _unfix_age?: number;
	private _fixed: boolean;
	private _mergeable: boolean;

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

	get fixed() {
		return this._fixed;
	}

	get mergeable() {
		return this._mergeable;
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
		this._velocity[0] += accel_vec[0];
		this._velocity[1] += accel_vec[1];
	}

	ghost(duration: number) {
		this._unghost_age = this.age + duration;
		this._ghosted = true;
	}

	setFixed(duration: number) {
		this._unfix_age = this.age + duration;
		this._fixed = true;
	}

	setMergeable(mergable: boolean) {
		this._mergeable = mergable;
	}

	// call this each frame
	update() {
		this._age += 1;
		this._radius = massToRadius(this.mass);
		if (!this._fixed) {
			for (const i of [0, 1]) {
				this._pos[i] += this._velocity[i];
			}
		} else {
			this._velocity = [0, 0];
		}
		if (this._unghost_age && this._unghost_age <= this.age) {
			this._unghost_age = undefined;
			this._ghosted = false;
		}
		if (this._unfix_age && this._unfix_age <= this.age) {
			this._unfix_age = undefined;
			this._fixed = false;
		}
	}
}
