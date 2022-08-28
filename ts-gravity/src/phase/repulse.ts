import KineticObj from "../KineticObj";
import { accelerateBoth, G } from "../PhysicsLib";
import Vec2 from "../Vec2";

export const R_EXPONENT = -1;
export const R = -6.673 * Math.pow(10, R_EXPONENT);
export const calcRForce = (k1: KineticObj, k2: KineticObj) => {
	return (R * k1.mass * k2.mass) / Vec2.distanceSq(k1.pos, k2.pos);
};
export const repulseBoth = (k1: KineticObj, k2: KineticObj) => {
	return accelerateBoth(k1, k2, calcRForce);
};

export default (kinetic_objs: KineticObj[]) => {
	for (let i = 0; i < kinetic_objs.length - 1; ++i) {
		const k1 = kinetic_objs[i];
		for (let j = i; j < kinetic_objs.length; ++j) {
			const k2 = kinetic_objs[j];
			repulseBoth(k1, k2);
		}
	}
};