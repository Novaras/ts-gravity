import KineticObj from "./KineticObj";
import Vec2 from "./Vec2";

export const G = 6.673 * Math.pow(10, -4);

export const angleBetweenPoints = (p1: Vec2, p2: Vec2) => {
	return Math.atan((p2.x - p1.x) / (p2.y - p1.y));
};

// angle in radians
export const scalarHypToVec = (hypotenous: number, angle: number) => {
	const adjacent = hypotenous * Math.sin(angle);
	const opposite = hypotenous * Math.cos(angle);

	return new Vec2(adjacent, opposite);
};

export const calcGForce = (k1: KineticObj, k2: KineticObj) => {
	return (G * k1.mass * k2.mass) / Math.pow(Vec2.distance(k1.pos, k2.pos), 1);
};

export const alignAccelVec = (accel_vec: Vec2, p1: Vec2, p2: Vec2) => {
	if (p1.x < p2.x) {
		accel_vec.x = Math.abs(accel_vec.x) * -1;
	} else {
		accel_vec.x = Math.abs(accel_vec.x);
	}

	if (p1.y < p2.y) {
		accel_vec.y = Math.abs(accel_vec.y) * -1;
	} else {
		accel_vec.y = Math.abs(accel_vec.y);
	}

	return accel_vec;
};

export const gravitateBoth = (k1: KineticObj, k2: KineticObj) => {
	const theta = angleBetweenPoints(k1.pos, k2.pos);
	const force = calcGForce(k1, k2);
	const f = scalarHypToVec(force, theta);

	// const a1 = force / k1.mass;
	// const a2 = force / k2.mass;

	// this is so expensive
	const av1 = new Vec2(
		f.x / k1.mass,
		f.y / k1.mass
	);
	const av2 = new Vec2(
		f.x / k2.mass,
		f.y / k2.mass
	);

	const av1a = alignAccelVec(av1, k2.pos, k1.pos);
	const av2a = alignAccelVec(av2, k1.pos, k2.pos);

	k1.accelerate(av1a);
	k2.accelerate(av2a);
};
