export type Vec2Castable = Vec2 | number | [number, number] | { x: number, y: number };

export const getXYFromVec2Castable = (veclike: Vec2Castable): { x: number, y: number } => {
	if (typeof veclike === `number`) return { x: veclike, y: veclike };
	else if (veclike instanceof Vec2) return veclike;
	else if (veclike instanceof Array) return { x: veclike[0], y: veclike[1] }
	else return veclike;
};

export default class Vec2 {
	constructor(public x: number, public y: number) { }

	toString(decimal_fix: number = 0) {
		const parse = (n: number) => {
			return n.toFixed(decimal_fix);
		};
		return `{${parse(this.x)}, ${parse(this.y)}}`;
	}

	set(other: Vec2Castable) {
		const vec = getXYFromVec2Castable(other);
		this.x = vec.x;
		this.y = vec.y;
		return this;
	}

	add(other: Vec2Castable) {
		const vec = getXYFromVec2Castable(other);
		this.x += vec.x;
		this.y += vec.y;
		return this;
	}

	sub(other: Vec2Castable) {
		const { x, y } = getXYFromVec2Castable(other);
		this.x -= x;
		this.y -= y;
		return this;
	}

	// x/n = mx
	// x/x = nm
	// 1 = nm
	// 1/n = m
	// 1/m = n

	multiply(other: Vec2Castable) {
		const vec = getXYFromVec2Castable(other);
		this.x *= vec.x;
		this.y *= vec.y;
		return this;
	}

	divide(other: Vec2Castable) {
		const vec = getXYFromVec2Castable(other);
		return this.multiply([vec.x, vec.y]);
	}

	static from(val: Vec2Castable) {
		if (typeof val === `number`) {
			return new Vec2(val, val);
		} else if (val instanceof Vec2) {
			return val.clone;
		} else if (val instanceof Array) {
			return new Vec2(val[0], val[1]);
		} else {
			return new Vec2(val.x, val.y);
		}
	}

	static distanceSq(v1: Vec2Castable, v2: Vec2Castable) {
		const { x: v1x, y: v1y } = getXYFromVec2Castable(v1);
		const { x: v2x, y: v2y } = getXYFromVec2Castable(v2);
		return Math.pow(v1x - v2x, 2) + Math.pow(v1y - v2y, 2);
	}

	static distance(v1: Vec2Castable, v2: Vec2Castable) {
		return Math.sqrt(Vec2.distanceSq(v1, v2));
	}

	get tuple(): [number, number] {
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

	static average<T extends Vec2Castable>(v1: T, v2: T) {
		const { x: v1x, y: v1y } = getXYFromVec2Castable(v1);
		const { x: v2x, y: v2y } = getXYFromVec2Castable(v2);
		const avg: [number, number] = [(v1x + v2x) / 2, (v1y + v2y) / 2];
		if (v1 instanceof Vec2) {
			return Vec2.from(avg);
		} else {
			return avg;
		}
	}
}
