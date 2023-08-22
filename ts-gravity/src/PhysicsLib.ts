import KineticObj from "./KineticObj";
import Vec2, { getXYFromVec2Castable, Vec2Castable } from "./Vec2";

export const G_EXPONENT = -3;
export const G = 6.673 * Math.pow(10, G_EXPONENT);

export const angleBetweenPoints = (p1: Vec2, p2: Vec2) => {
	return Math.atan((p2.x - p1.x) / (p2.y - p1.y));
};

// angle in radians
export const scalarHypToVec = (hypotenous: number, angle: number) => {
	const adjacent = hypotenous * Math.sin(angle);
	const opposite = hypotenous * Math.cos(angle);

	return { x: adjacent, y: opposite };
};

export const calcGForce = (k1: KineticObj, k2: KineticObj) => {
	// return (G * k1.mass * k2.mass) / Math.pow(Vec2.distance(k1.pos, k2.pos), 1.3); // GMm / r^?
	return ((k1.mass + k2.mass) * 1e-6) + ((G * k1.mass * k2.mass) / Vec2.distance(k1.pos, k2.pos)); // we can use sq of distance if exponent here is 2 to avoid the sqrt
};

export const alignAccelVec = (accel_vec: Vec2Castable, p1: Vec2, p2: Vec2, sign: -1|1): { x: number, y: number } & Vec2Castable => {
	let { x: ax, y: ay } = getXYFromVec2Castable(accel_vec);
	if (p1.x < p2.x) {
		ax = Math.abs(ax) * -sign;
	} else {
		ax = Math.abs(ax) * sign;
	}

	if (p1.y < p2.y) {
		ay = Math.abs(ay) * -sign;
	} else {
		ay = Math.abs(ay) * sign;
	}

	return { x: ax, y: ay };
};

export const accelerateBoth = (k1: KineticObj, k2: KineticObj, forceFn: (k1: KineticObj, k2: KineticObj) => number) => {
	const f = forceFn(k1, k2);
	const sign = f >= 0 ? 1 : -1;
	const t = angleBetweenPoints(k1.pos, k2.pos);
	const [a1, a2] = [f / k1.mass, f / k2.mass];

	const av1 = alignAccelVec(scalarHypToVec(a1, t), k2.pos, k1.pos, sign);
	const av2 = alignAccelVec(scalarHypToVec(a2, t), k1.pos, k2.pos, sign);


	k1.accelerate(av1);
	k2.accelerate(av2);

	return [av1, av2];
};

export const gravitateBoth = (k1: KineticObj, k2: KineticObj) => {
	return accelerateBoth(k1, k2, calcGForce);
};

export const sortByMass = (a: KineticObj, b: KineticObj) => {
	if (a.mass < b.mass) return -1;
	else if (a.mass > b.mass) return 1;
	return 0;
};
