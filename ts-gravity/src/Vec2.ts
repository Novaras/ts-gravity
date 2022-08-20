export default class Vec2 {
	constructor(public x: number, public y: number) { }

	toString(radix: number = 10, decimal_fix: number = 0) {
		const parse = (n: number) => {
			return parseFloat(n.toFixed(decimal_fix)).toString(radix);
		};
		return `{${parse(this.x)}, ${parse(this.y)}}`;
	}

	add(other: Vec2 | number) {
		if (typeof other === `number`) {
			this.x += other;
			this.y += other;
		} else {
			this.x += other.x;
			this.y += other.y;
		}
		return this;
	}

	sub(other: Vec2 | number) {
		if (typeof other === `number`) {
			this.x -= other;
			this.y -= other;
		} else {
			this.x -= other.x;
			this.y -= other.y;
		}
		return this;
	}

	multiply(other: Vec2 | number) {
		if (typeof other === `number`) {
			this.x *= other;
			this.y *= other;
		} else {
			this.x *= other.x;
			this.y *= other.y;
		}
		return this;
	}

	static distance(v1: Vec2, v2: Vec2) {
		return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
	}

	get inversion() {
		return new Vec2(this.x * -1, this.y * -1);
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
