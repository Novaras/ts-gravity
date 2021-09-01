export default class Vec2 {
	constructor(public x: number, public y: number) { }

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
}
