import KineticObj from "../KineticObj";
import { sortByMass } from "../PhysicsLib";
import Vec2 from "../Vec2";

export default (kinetic_objs: KineticObj[]) => {
	const merged_pairs: [string, string][] = [];
	for (let i = 0; i < kinetic_objs.length - 1; ++i) {
		const k1 = kinetic_objs[i];
		if (k1.ghosted) continue;
		for (let j = i + 1; j < kinetic_objs.length; ++j) {
			const k2 = kinetic_objs[j];
			// theoretically if we check the next position correctly, we shouldn't need to check the
			// current positions, since the previous pass should have caught those collisions already
			if (Vec2.distanceSq(k1.next_pos, k2.next_pos) <= Math.pow((k1.radius + k2.radius), 2)) {
				merged_pairs.push([k1.id, k2.id]);
				// playing = false;
				const mass = k1.mass + k2.mass;
				const vel = new Vec2(
					(k1.momentum.x + k2.momentum.x) / mass,
					(k1.momentum.y + k2.momentum.y) / mass
				);

				const [smaller, larger] = [k1, k2].sort(sortByMass);

				larger.setMass(mass);
				larger.setVelocity(vel);

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
				if (k1 === smaller) {
					kinetic_objs.splice(i, 1, larger);
				}
				kinetic_objs.splice(j, 1);
			}
		}
	}
	return merged_pairs;
};