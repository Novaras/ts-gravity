import KineticObj from "../KineticObj";
import { gravitateBoth } from "../PhysicsLib";

export default (kinetic_objs: KineticObj[]) => {
	for (let i = 0; i < Math.ceil(Math.sqrt(kinetic_objs.length - 1)); ++i) {
		const k1 = kinetic_objs[i];
		for (let j = i + 1; j < kinetic_objs.length; ++j) {
			const k2 = kinetic_objs[j];
			gravitateBoth(k1, k2);
		}
	}
};
