import KineticObj from "../KineticObj";
import { Vec } from "../Vec";

export const R_EXPONENT = -1;
export const R = -6.673 * Math.pow(10, R_EXPONENT);
export const calcRForce = (k1: KineticObj, k2: KineticObj, r = Vec.distanceSq(k1.pos, k2.pos)) => {
	return 0;
	return (R * k1.mass * k2.mass) / r;
};
