import KineticObj from "../KineticObj";
import { G, G_EXPONENT, scalarHypToVec } from "../PhysicsLib";
import { randArrValue, randInt } from "../rand-util";
import { Vec } from "../Vec";

export const STABILITY_FACTOR = 1e-9;
export const STABLE_MASS_LIMIT = 1.75e5;
export const GHOST_TIME = 140;

export const shuffleArray = <T>(arr: T[]): void => {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
};

const shouldDecay = (k_obj: KineticObj) => {
	const r = Math.random();
	// if (k_obj.mass > STABLE_MASS_LIMIT) {
	// 	const chance = Math.min(1, Math.pow(1e-7 * k_obj.mass / 4, 1.275));
	// 	if (r < chance) {
	// 		console.log(`${k_obj.id} (age ${k_obj.age}, mass ${k_obj.mass}) exploding, chance was ${chance}, r was ${r}`);
	// 	}
	// }
	return k_obj.mass > STABLE_MASS_LIMIT && r < Math.min(1, Math.pow(STABILITY_FACTOR * k_obj.mass, 1.3));
}

export default (kinetic_objs: KineticObj[], idFactory: () => string) => {
	const new_objects: KineticObj[] = [];
	const objects_to_decay = kinetic_objs.filter(k_obj => !k_obj.ghosted && shouldDecay(k_obj));

	for (const [i, decay_obj] of objects_to_decay.entries()) {
		console.log(decay_obj);
		let mass_pool = decay_obj.mass;
		while (mass_pool > 0) {
			const mass_share = mass_pool <= decay_obj.mass / 20 ? mass_pool : Math.min(randInt(mass_pool / 30, mass_pool / 15), mass_pool);
			mass_pool = Math.max(0, mass_pool -= mass_share);

			const new_obj = new KineticObj(
				mass_share,
				decay_obj.pos,
				[0, 0],
				idFactory()
			);
			new_obj.ghost(GHOST_TIME + Math.random() * GHOST_TIME * 0.7);
			new_objects.push(new_obj);
		}
		shuffleArray(new_objects);
		const velocity_mag = Math.min(60, Math.max(0.1, Math.random() * Math.pow(decay_obj.mass, 2) * Math.pow(10, G_EXPONENT))) + randArrValue([0, 2, 4, 8]);
		const angle_step = (2 * Math.PI) / new_objects.length;
		console.log(`we made ${new_objects.length} new objects, angle step is ${angle_step}, vmag is ${velocity_mag}`);
		for (const [i, n_obj] of new_objects.entries()) {
			const angle = angle_step * i * (1 + Math.random());
			const v = Vec.add(decay_obj.velocity, scalarHypToVec(velocity_mag * randArrValue([0.3, 0.5, 0.8, 1, 1.3, 2.5]), angle));
			n_obj.setVelocity(v);
		}
		console.log(`mass total was: ${decay_obj.mass}`);
		console.log(`new objects mass total: ${new_objects.reduce((total, n_obj) => total + n_obj.mass, 0)}`);
		console.log(`pool remaining: ${mass_pool}`);
		kinetic_objs.splice(kinetic_objs.findIndex(k_obj => k_obj.id === decay_obj.id), 1);
	}
	kinetic_objs.push(...new_objects);
	return objects_to_decay;
};