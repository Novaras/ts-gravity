import KineticObj from "../KineticObj";
import { sortByMass } from "../PhysicsLib";
import { Vec } from "../Vec";
import { universe_cells } from "./physics";

export const mergerOf = (mergee: KineticObj, merger: KineticObj) => {
	const mass = merger.mass + mergee.mass;
	const vel: Vec = [
		(merger.momentum[0] + mergee.momentum[0]) / mass,
		(merger.momentum[1] + mergee.momentum[1]) / mass
	];

	return new KineticObj(mass, mergee.pos, vel, `m(${merger.id}+${mergee.id})`);
};

export const baryCenterReduce = (barycenter: KineticObj, k_obj: KineticObj) => {
	const merger = mergerOf(barycenter, k_obj);
	// merger.setMass((merger.mass + k_obj.mass) / 2);
	// const pb = Vec.mulScalar(barycenter.pos, barycenter.mass);
	// const po = Vec.mulScalar(k_obj.pos, k_obj.mass);
	// merger.setPos(Vec.divScalar(Vec.average(pb, po), (barycenter.mass + k_obj.mass) / 2));

	merger.setPos([
		(barycenter.mass * barycenter.pos[0] + k_obj.mass * k_obj.pos[0]) / (barycenter.mass + k_obj.mass),
		(barycenter.mass * barycenter.pos[1] + k_obj.mass * k_obj.pos[1]) / (barycenter.mass + k_obj.mass),
	]);
	return merger;
};
export const kineticObjsToBarycenter = (kinetic_objs: KineticObj[], label: string = `*`) => kinetic_objs.reduce(baryCenterReduce, new KineticObj(0, [0,0], [0,0], label));

const getUniverseBoundingRect = (kinetic_objs: KineticObj[]): [Vec, Vec] => {
	let min_x = 0;
	let min_y = 0;
	let max_x = 0;
	let max_y = 0;
	for (let i = 0; i < kinetic_objs.length; ++i) {
		const k_obj = kinetic_objs[i];
		if (k_obj.pos[0] < min_x) min_x = k_obj.pos[0];
		else if (k_obj.pos[1] > max_x) max_x = k_obj.pos[0];

		if (k_obj.pos[1] < min_y) min_y = k_obj.pos[1];
		else if (k_obj.pos[1] > max_y) max_y = k_obj.pos[1];
	}
	return [
		[min_x, min_y],
		[max_x, max_y]
	];
};

export default (kinetic_objs: KineticObj[]) => {
	// console.log(`merge call`);
	const merged_pairs: [string, string][] = [];

	if (kinetic_objs.length < 2) return merged_pairs;

	universe_cells.forEach(cell => {
		const { k_objs } = cell;
		if (k_objs.length < 2) return;

		for (let i = 0; i < k_objs.length - 1; ++i) {
			const k1 = k_objs[i];
			if (k1.ghosted) continue;
			for (let j = i + 1; j < k_objs.length; ++j) {
				const k2 = k_objs[j];
				if (k2.ghosted) continue;

				const d2 = Vec.distanceSq(k1.next_pos, k2.next_pos);
				const r2 = Math.pow((k1.radius + k2.radius), 2);
				if (d2 <= r2) {
					const [smaller, larger] = [k1, k2].sort(sortByMass);
					const merger = mergerOf(smaller, larger);

					larger.setMass(merger.mass);
					larger.setVelocity(merger.velocity);

					const [i1, j1] = [k1, k2].map(k => kinetic_objs.findIndex(other => other.id === k.id));
					if (k1.id === smaller.id) {
						kinetic_objs.splice(i1, 1, larger);
					}
					kinetic_objs.splice(j1, 1);
				}
			}
		}
	});
	return merged_pairs;
};