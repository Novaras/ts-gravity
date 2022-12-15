export type Vec = [number, number];
export const Vec = (() => {
	const map = (v: Vec, mapFn: (n: number, i: number, v: number[]) => number) => {
		return v.map(mapFn) as Vec;
	};

	const addScalar = (v: Vec, n: number): Vec => ([v[0] + n, v[1] + n]);
	const subScalar = (v: Vec, n: number) => addScalar(v, -n);
	const mulScalar = (v: Vec, factor: number): Vec => ([v[0] * factor, v[1] * factor]);
	const divScalar = (v: Vec, factor: number) => mulScalar(v, 1 / factor);
	const scalarHypToVec = (hypotenous: number, angle: number): Vec => {
		const adjacent = hypotenous * Math.sin(angle);
		const opposite = hypotenous * Math.cos(angle);
	
		return [opposite, adjacent];
	};

	const add = (v1: Vec, v2: Vec): Vec => ([v1[0] + v2[0], v1[1] + v2[1]]);
	const sub = (v1: Vec, v2: Vec): Vec => ([v1[0] - v2[0], v1[1] - v2[1]]);
	const dot = (v1: Vec, v2: Vec): number => (v1[0] * v2[0] + v1[1] * v2[1]);
	const det = (v1: Vec, v2: Vec): number => (v1[0] * v2[1] - v1[1] * v2[0]);

	const average = (v1: Vec, v2: Vec): Vec => ([(v1[0] + v2[0]) / 2, (v1[1] + v2[1]) / 2]);
	const eq = (v1: Vec, v2: Vec) => (v1[0] === v2[0] && v1[1] === v2[1]);

	const distance = (v1: Vec, v2: Vec) => Math.hypot((v2[0] - v1[0]), (v2[1] - v1[0]));
	const distanceSq = (v1: Vec, v2: Vec) => (Math.pow(v2[0] - v1[0], 2) + Math.pow(v2[1] - v1[1], 2));
	const proximate = (v1: Vec, v2: Vec, radius: number) => distanceSq(v1, v2) < Math.pow(radius, 2);
	const vecBetween = (v1: Vec, v2: Vec): Vec => ([v2[0] - v1[0], v2[1] - v1[1]]);
	const area = (v: Vec) => v[0] * v[1];

	const magnitude = (v: Vec) => Math.hypot(v[0], v[1]);
	const unit = (v: Vec) => divScalar(v, magnitude(v));

	const toString = (v: Vec, precision: number = 2) => `{${v[0].toPrecision(precision)}, ${v[1].toPrecision(precision)}}`;

	return { map, addScalar, subScalar, mulScalar, divScalar, scalarHypToVec, add, sub, dot, det, average, eq, distance, distanceSq, proximate, vecBetween, area, magnitude, unit, toString };
})();