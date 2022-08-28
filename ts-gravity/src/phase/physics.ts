import KineticObj from "../KineticObj";
import { accelerateBoth, calcGForce, G, gravitateBoth } from "../PhysicsLib";
import Vec2 from "../Vec2";
import { calcRForce, repulseBoth } from "./repulse";

export default (kinetic_objs: KineticObj[]) => {
	// const { barycenter, mass_total } = kinetic_objs.reduce((acc, k_obj) => {
	// 	return {
	// 		barycenter: Vec2.average(acc.barycenter, k_obj.pos.tuple) as [number, number],
	// 		mass_total: acc.mass_total + k_obj.mass
	// 	};
	// }, {
	// 	barycenter: [0, 0] as [number, number],
	// 	mass_total: 0
	// });
	for (let i = 0; i < kinetic_objs.length - 1; ++i) {
		const k1 = kinetic_objs[i];
		if (k1.ghosted) continue;
		for (let j = i + 1; j < kinetic_objs.length; ++j) {
			const k2 = kinetic_objs[j];
			if (k2.ghosted) continue;
			accelerateBoth(k1, k2, (k1, k2) => {
				const g = calcGForce(k1, k2);
				const r = calcRForce(k1, k2);

				const f_limit = Infinity;
				let f = g + r;
				if (Math.abs(f) > f_limit) f = (Math.abs(f) / f) * f_limit;

				return f;
			});
		}

		// barycenter sans this object = avg(barycenter, -1 * this object pos)
		// const others_barycenter = Vec2.average(barycenter, [-k1.pos.x, -k1.pos.y]);

		// const [mx, my] = (() => {
		// 	let mx = 0;
		// 	let my = 0;
		// 	for (let k = i; k < kinetic_objs.length - 1; ++k) {
		// 		const k2 = kinetic_objs[k];
		// 		if (k2.pos.x < k1.pos.x) mx -= k2.mass;
		// 		else mx += k2.mass;

		// 		if (k2.pos.y < k1.pos.y) my -= k2.mass;
		// 		else my += k2.mass;
		// 	}
		// 	return [mx, my];
		// })();

	}
};
