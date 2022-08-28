import KineticObj from "./KineticObj";
import Vec2, { getXYFromVec2Castable, Vec2Castable } from "./Vec2";

export const G_EXPONENT = -3.5;
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
	return (10) + ((G * k1.mass * k2.mass) / Vec2.distance(k1.pos, k2.pos)); // we can use sq of distance if exponent here is 2 to avoid the sqrt
};

export const alignAccelVec = (accel_vec: Vec2Castable, p1: Vec2, p2: Vec2): { x: number, y: number } & Vec2Castable => {
	let { x: ax, y: ay } = getXYFromVec2Castable(accel_vec);
	if (p1.x < p2.x) {
		ax = Math.abs(ax) * -1;
	} else {
		ax = Math.abs(ax);
	}

	if (p1.y < p2.y) {
		ay = Math.abs(ay) * -1;
	} else {
		ay = Math.abs(ay);
	}

	return { x: ax, y: ay };
};

export const accelerateBoth = (k1: KineticObj, k2: KineticObj, forceFn: (k1: KineticObj, k2: KineticObj) => number) => {
	const theta = angleBetweenPoints(k1.pos, k2.pos);
	const force = forceFn(k1, k2);
	// split the scalar force into components x, y
	const f = scalarHypToVec(force, theta);

	
	// console.log(`f: ${force}`);
	// console.log(`fv: {${f.x}, ${f.y}}`);

	// const a1 = force / k1.mass;
	// const a2 = force / k2.mass;

	// this is so expensive
	// calc the accel vectors for both objects
	const av1 = {
		x: f.x / k1.mass,
		y: f.y / k1.mass
	};
	const av2 = {
		x: f.x / k2.mass,
		y: f.y / k2.mass
	};

	// console.log(`av1: {${av1.x}, ${av1.y}}\tav2: {${av2.x}, ${av2.y}}`);

	const av1a = alignAccelVec(av1, k2.pos, k1.pos);
	const av2a = alignAccelVec(av2, k1.pos, k2.pos);

	// console.log(`k1av: ${av1a.toString()}\tk2av: ${av2a.toString()}`);
	// console.groupEnd();

	k1.accelerate(av1a);
	k2.accelerate(av2a);

	return [av1a, av2a];
};

export const gravitateBoth = (k1: KineticObj, k2: KineticObj) => {
	return accelerateBoth(k1, k2, calcGForce);
};

export const sortByMass = (a: KineticObj, b: KineticObj) => {
	if (a.mass < b.mass) return -1;
	else if (a.mass > b.mass) return 1;
	return 0;
};
