import KineticObj from "./KineticObj";
import { calcRForce } from "./phase/repulse";
import { Vec } from "./Vec";

export let G_COEFF = 1;
export const alterGCoeff = (val: number) => G_COEFF = val;
export let G_EXPONENT = 0;
export const alterGExponent = (val: number) => G_EXPONENT = val;

export const G = () => G_COEFF * Math.pow(10, G_EXPONENT);

export const calcGForce = (k1: KineticObj, k2: KineticObj, r = Vec.distanceSq(k1.pos, k2.pos)) => {
	// return (G * k1.mass * k2.mass) / Math.pow(Vec.distance(k1.pos, k2.pos), 1.3); // GMm / r^?
	return (G() * k1.mass * k2.mass) / r; // we can use sq of distance if exponent here is 2 to avoid the sqrt
};

export const angleBetweenPoints = (p1: Vec, p2: Vec) => {
	const dx = p2[0] - p1[0];
	const dy = p2[1] - p1[1];
	let theta = (dx || dy) ? Math.atan2(dy, dx) : 0;
	if (theta < 0) theta += Math.PI * 2;
	return theta;
};

// angle in radians
export const scalarHypToVec = (hypotenous: number, angle: number): Vec => {
	const adjacent = hypotenous * Math.sin(angle);
	const opposite = hypotenous * Math.cos(angle);

	return [opposite, adjacent];
};

// export const alignVecBetween = (vec: Vec, p1: Vec, p2: Vec): Vec => {
// 	let [ax, ay] = vec;
// 	if (p1[0] < p2[0]) {
// 		ax = Math.abs(ax) * -1;
// 	} else {
// 		ax = Math.abs(ax);
// 	}

// 	if (p1[1] < p2[1]) {
// 		ay = Math.abs(ay) * -1;
// 	} else {
// 		ay = Math.abs(ay);
// 	}

// 	return [ ax, ay ];
// };

export type ForceFn = (k1: KineticObj, k2: KineticObj) => number;
export const netForceBetween = (k1: KineticObj, k2: KineticObj, forces: ForceFn[] = [calcGForce, calcRForce]) => {
	return forces.reduce((net_force, forceFn, i) => {
		const force = forceFn(k1, k2);
		// console.log(`F${i} = ${force}`);
		return net_force + force;
	}, 0);
};

export const forceVecBetween = (k1: KineticObj, k2: KineticObj) => {
	const theta = angleBetweenPoints(k1.pos, k2.pos);
	const f_mag = netForceBetween(k1, k2);
	return scalarHypToVec(f_mag, theta);
};

export const forceToAccelVecs = (force: number, k1: KineticObj, k2: KineticObj) => {
	const theta = angleBetweenPoints(k1.pos, k2.pos);
	// split the scalar force into components x, y
	const [fx, fy] = scalarHypToVec(force, theta);
	const av1 = [ fx / k1.mass, fy / k1.mass ] as Vec;
	const av2 = [ -fx / k2.mass, -fy / k2.mass ] as Vec;

	return [av1, av2];
};

export const accelerateBoth = (k1: KineticObj, k2: KineticObj, forceFn: (k1: KineticObj, k2: KineticObj) => number) => {
	const force = forceFn(k1, k2);

	const [av1, av2] = forceToAccelVecs(force, k1, k2);

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
