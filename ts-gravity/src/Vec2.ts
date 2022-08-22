export type Vec2Castable = Vec2 | number | [number, number];

export default class Vec2 {
	constructor(public x: number, public y: number) { }

	toString(decimal_fix: number = 0) {
		const parse = (n: number) => {
			return n.toFixed(decimal_fix);
		};
		return `{${parse(this.x)}, ${parse(this.y)}}`;
	}

	set(other: Vec2Castable) {
		const vec = Vec2.from(other);
		this.x = vec.x;
		this.y = vec.y;
		return this;
	}

	add(other: Vec2Castable) {
		const vec = Vec2.from(other);
		this.x += vec.x;
		this.y += vec.y;
		return this;
	}

	sub(other: Vec2Castable) {
		const vec = Vec2.from(other).inversion;
		return this.add(vec);
	}

	// x/n = mx
	// x/x = nm
	// 1 = nm
	// 1/n = m
	// 1/m = n

	multiply(other: Vec2Castable) {
		const vec = Vec2.from(other);
		this.x *= vec.x;
		this.y *= vec.y;
		return this;
	}

	divide(other: Vec2Castable) {
		const vec = Vec2.from(other).reciprocal;
		return this.multiply(vec);
	}

	static from(val: Vec2Castable) {
		if (typeof val === `number`) {
			return new Vec2(val, val);
		} else if (val instanceof Vec2) {
			return val.clone;
		} else {
			return new Vec2(val[0], val[1]);
		}
	}

	static distance(v1: Vec2, v2: Vec2) {
		return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
	}

	get tuple() {
		return [this.x, this.y];
	}

	get magnitude() {
		return Math.abs(this.x) + Math.abs(this.y);
	}

	get inversion() {
		return this.clone.multiply(-1);
	}

	get reciprocal() {
		return this.clone.multiply(0.1);
	}

	get clone() {
		return new Vec2(this.x, this.y);
	}

	static eq(v1: Vec2, v2: Vec2) {
		return v1.x === v2.x && v1.y === v2.y;
	}

	eq(other: Vec2) {
		return Vec2.eq(this, other);
	}

	static areProximate(v1: Vec2, v2: Vec2, proximity_radius: number) {
		return Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2) < Math.pow(proximity_radius, 2);
	}

	isProximateTo(other: Vec2, proximity_radius: number) {
		return Vec2.areProximate(this, other, proximity_radius);
	}
}
