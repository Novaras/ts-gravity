import KineticObj from "../KineticObj";
import { accelerateBoth, angleBetweenPoints, calcGForce, forceToAccelVecs, netForceBetween, scalarHypToVec } from "../PhysicsLib";
import { Vec } from "../Vec";
import { mergerOf, baryCenterReduce } from "./merge";
import { calcRForce } from "./repulse";

let distances_chart: {[key: string]: {[key: string]: number}} = {};

const attractFullyGranular = (kinetic_objs: KineticObj[]) => {
	distances_chart = {};
	for (let i = 0; i < kinetic_objs.length - 1; ++i) {
		const k1 = kinetic_objs[i];
		if (k1.ghosted) continue;
		for (let j = i + 1; j < kinetic_objs.length; ++j) {
			const k2 = kinetic_objs[j];
			if (k2.ghosted) continue;

			distances_chart[k1.id] = distances_chart[k1.id] ?? {};
			const lookup = distances_chart[k1.id][k2.id];
			// console.log(`lookup for ${k_obj.id}-${other_obj.id}: ${lookup}`);
			const d2 = lookup ? lookup : Vec.distanceSq(k1.pos, k2.pos);
			if (!lookup) distances_chart[k1.id][k2.id] = d2;

			accelerateBoth(k1, k2, (k1, k2) => {
				const g = calcGForce(k1, k2, d2);
				const r = calcRForce(k1, k2, d2);

				const f_limit = Infinity;
				let f = g + r;
				if (Math.abs(f) > f_limit) f = (Math.abs(f) / f) * f_limit;

				// if (i === 0 && j === 1) {
				// 	console.group(`${k1.id} <-> ${k2.id}`);
				// 	console.log(`dist: ${Vec.distance(k1.pos, k2.pos)}`)
				// 	console.log(`g: ${g}\tr: ${r}`);
				// 	console.log(`f: ${f}`);
				// 	console.groupEnd();
				// } 

				return f;
			});
		}
	}
};

const attractWithUniverseBarycenter = (kinetic_objs: KineticObj[]) => {
	// console.log(kinetic_objs);
	kinetic_objs = kinetic_objs.filter(k_obj => !k_obj.ghosted);
	const barycenter = kinetic_objs.slice(1).reduce((barycenter, k_obj) => {
		// console.group(`calc B <-> ${k_obj.id}`);
		// console.log(barycenter);
		// console.log(k_obj);
		const merger = mergerOf(barycenter, k_obj);
		merger.setPos(Vec.average(merger.pos, k_obj.pos));
		// console.log(merger);
		// console.groupEnd();
		return merger;
	}, kinetic_objs[0]);

	// console.log(`barycenter calculated:`);
	// console.log(barycenter);

	kinetic_objs.forEach(k_obj => {
		// console.group(`obj ${k_obj.id}`);
		const theta = angleBetweenPoints(barycenter.pos, k_obj.pos);
		const [p_b, p_k] = [barycenter.pos, k_obj.pos];
		const offset = scalarHypToVec(Vec.distance(p_b, p_k), theta);
		// console.log(`offset: {${offset.x}, ${offset.y}}`);

		const relative_barycenter = new KineticObj(
			barycenter.mass - k_obj.mass,
			Vec.add(barycenter.pos, offset),
			[0, 0],
			``
		);
		// console.log(`rel`);
		// console.log(relative_barycenter);
		const force = netForceBetween(k_obj, relative_barycenter);
		// console.log(`f: ${force}`);
		const accel = forceToAccelVecs(force, barycenter, k_obj)[1];
		// console.log(`accel:`);
		// console.log(accel);
		k_obj.accelerate(accel);
		// console.groupEnd();
	});
};

const attractWithConcentricBarycenters = (kinetic_objs: KineticObj[]) => {
	const ring_granularity = 8;
	kinetic_objs.forEach((k_obj, i) => {
		const available_objects = kinetic_objs.filter(other_obj => other_obj.id !== k_obj.id);
		const rings = [];

		const furthest = available_objects.reduce((furthest, other_obj) => {
			const d2 = Vec.distanceSq(k_obj.pos, other_obj.pos);
			return d2 > furthest ? d2 : furthest;
		}, 0);
		const ring_grow = furthest / ring_granularity;

		// console.log(`${k_obj.id}: furthest = ${furthest}, r_g = ${ring_grow}`);

		let r = ring_grow;
		while(r <= furthest + ring_grow) {

			const to_remove: string[] = [];
			// ring = all objects closer than r, sans those we already used
			// console.group(`o: ${k_obj.id}`);
			const ring = available_objects.filter(other_obj => {
				distances_chart[k_obj.id] = distances_chart[k_obj.id] ?? {};
				const lookup = distances_chart[k_obj.id][other_obj.id];
				// console.log(`lookup for ${k_obj.id}-${other_obj.id}: ${lookup}`);
				const d2 = lookup ? lookup : Vec.distanceSq(k_obj.pos, other_obj.pos);
				if (!lookup) distances_chart[k_obj.id][other_obj.id] = d2;
				// console.log(`dsq ${k_obj.id}-${other_obj.id}: ${d2}`);
				if (d2 <= r && d2 >= r - ring_grow) {
					to_remove.push(other_obj.id);
					return true;
				}
			});

			// console.log(`r: ${r}`);
			// console.log(`alpha: ${alpha}`);
			// console.log(available_objects);
			// console.log(ring);
			// console.groupEnd();

			if (ring.length) {
				// remove used objects for next pass
				// available_objects = available_objects.filter(k_obj => !to_remove.includes(k_obj.id));

				const ring_barycenter = ring.reduce(baryCenterReduce);

				const f = netForceBetween(k_obj, ring_barycenter);
				const a = forceToAccelVecs(f, k_obj, ring_barycenter)[0];
				k_obj.accelerate(a);
				rings.push({
					r,
					ring,
					B: ring_barycenter,
				});
			}
			r += ring_grow;
		}
		// console.log(distances_chart);
		if (i === 0 && Math.random() < 0.005) {
			console.log(rings);
		}
	});
};

export default (kinetic_objs: KineticObj[]) => {
	// console.log(`phys call`);
	if (kinetic_objs.length < 2) return;

	
	attractFullyGranular(kinetic_objs);
	// attractWithUniverseBarycenter(kinetic_objs);
	// attractWithConcentricBarycenters(kinetic_objs);
	
};
