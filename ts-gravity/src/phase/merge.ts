import KineticObj from "../KineticObj";
import { sortByMass } from "../PhysicsLib";
import { Vec } from "../Vec";

export const mergerOf = (mergee: KineticObj, merger: KineticObj) => {
	const mass = merger.mass + mergee.mass;
	const vel: Vec = [
		(merger.momentum[0] + mergee.momentum[0]) / mass,
		(merger.momentum[1] + mergee.momentum[1]) / mass
	];

	return new KineticObj(mass, mergee.pos, vel, `m(${merger.id}->${mergee.id})`);
};

export const baryCenterReduce = (barycenter: KineticObj, k_obj: KineticObj) => {
	const merger = mergerOf(barycenter, k_obj);
	// merger.setMass((merger.mass + k_obj.mass) / 2);
	// const pb = Vec.mulScalar(barycenter.pos, barycenter.mass);
	// const po = Vec.mulScalar(k_obj.pos, k_obj.mass);
	// merger.setPos(Vec.divScalar(Vec.average(pb, po), (barycenter.mass + k_obj.mass) / 2));
	merger.setPos(Vec.divScalar(Vec.add(barycenter.pos, k_obj.pos), 2));
	return merger;
};
export const kineticObjsToBarycenter = (kinetic_objs: KineticObj[]) => kinetic_objs.reduce(baryCenterReduce);

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

	for (let i = 0; i < kinetic_objs.length - 1; ++i) {
		const k1 = kinetic_objs[i];
		if (k1.ghosted) continue;
		for (let j = i + 1; j < kinetic_objs.length; ++j) {
			const k2 = kinetic_objs[j];
			// theoretically if we check the next position correctly, we shouldn't need to check the
			// current positions, since the previous pass should have caught those collisions already

			// bounding rectangle topleft corners
			
			const d2 = Vec.distanceSq(k1.next_pos, k2.next_pos);
			const r2 = Math.pow((k1.radius + k2.radius), 2);
			if (d2 <= r2) {
				merged_pairs.push([k1.id, k2.id]);
				// playing = false;
				const [smaller, larger] = [k1, k2].sort(sortByMass);
				const merger = mergerOf(smaller, larger);

				larger.setMass(merger.mass);
				larger.setVelocity(merger.velocity);

				// const propPos = (k1_scalar_pos: number, k2_scalar_pos: number, p1: number, p2: number) => {
				// 	return ((p1 * k1_scalar_pos) + (p2 * k2_scalar_pos)) / (k1_scalar_pos + k2_scalar_pos);
				// };

				// const pPos = (k1, k2) => {
				// 	const smaller = k1.mass > k2.mass ? k2.mass : k1.mass;
				// 	const [p1, p2] = [k1.mass / smaller, k2.mass / smaller];
				// 	return (dim: `x` | `y`) => {
				// 		return 
				// 	};
				// };

				// k1.setPos(new Vec2(
				// 	propPos(k1.pos.x, k2.pos.x, p1, p2),
				// 	(() + ()) / ()
				// ));

				// mrx = (m1x + m2x) / 2
				// with mass proportions accounted:
				// mrx = (m1p * m1x + m2p * m2x) / (m1p + m2p)

				// if k1 is 2x more massive:
				// (1 * 2, 3 * 2)
				// (2 * 1, 8 * 1)
				// mx = (2 + 2) / 3
				//    = 1.33 nice

				// if k2 is 2x more massive:
				// mx = ((1 * 1) + (2 * 2)) / 3
				//    = (1 + 4) / 3
				//    = 1.66 awesome

				// normally we splice the higher index, but if that obj 'wins' the merger by being larger,
				// then we need to swap the smaller with the updated larger object before its deleted
				// (the high index is always the one spliced)
				if (k1.id === smaller.id) {
					kinetic_objs.splice(i, 1, larger);
				}
				kinetic_objs.splice(j, 1);
			}
		}
	}
	return merged_pairs;
};