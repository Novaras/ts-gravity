import KineticObj from "../KineticObj";
import { scalarHypToVec } from "../PhysicsLib";
import { randInt } from "../rand-util";

export const STABLE_MASS_LIMIT = 5e5;

const shouldDecay = (k_obj: KineticObj) => {
	const limit = (Math.random() * STABLE_MASS_LIMIT * 10) + STABLE_MASS_LIMIT;
	return k_obj.mass > limit && Math.random() > 0.999;
}

export default (kinetic_objs: KineticObj[]) => {
	const new_objects: KineticObj[] = [];
	for (const [i, k_obj] of kinetic_objs.entries()) {
		// console.log(`check obj ${i}`);
		if (k_obj.ghosted) continue;
		if (shouldDecay(k_obj)) {
			console.log(k_obj);
			const parts_count = randInt(10, Math.min(Math.ceil(k_obj.mass / 1000), 50));
			const angle_step = (2 * Math.PI) / parts_count;


			console.log(`ok, try to make ${parts_count} new objects`);
			let mass_pool = k_obj.mass;
			for (let i = 0; i < parts_count; ++i) {
				const velocity_mag = Math.min(7, Math.max(1, k_obj.mass / 1e6)) + Math.random() * 10;
				const angle = angle_step * i;
				// const mass_share = i + 1 < parts_count
				// 	? (k_obj.mass / parts_count) // 0.95 - 1.05 * mass / count
				// 	: mass_pool;
				// share = normal slice of the pool, plus or minus 5%
				const mass_share = Math.min((mass_pool / parts_count) + (Math.random() > 0.5 ? 1 : -1) * (mass_pool / (parts_count * 20)), mass_pool);
				mass_pool -= mass_share;

				const v = k_obj.velocity.clone().add(scalarHypToVec(velocity_mag, angle));
				const new_obj = new KineticObj(
					mass_share,
					k_obj.pos.clone(),
					v
				);
				console.log(new_obj);
				new_obj.ghost(100);
				new_objects.push(new_obj);
			}
			kinetic_objs.splice(i, 1);
		}
	}
	kinetic_objs.push(...new_objects);
};