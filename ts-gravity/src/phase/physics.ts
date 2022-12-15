import { InteractionInfo, InteractionsCacheHandler } from "../InteractionCache";
import KineticObj from "../KineticObj";
import { kinetic_objs } from "../main";
import { accelerateBoth, angleBetweenPoints, calcGForce, forceToAccelVecs, forceVecBetween, netForceBetween, scalarHypToVec } from "../PhysicsLib";
import { pointInRect, Rect, subDivideRect } from "../Rect";
import { Vec } from "../Vec";
import { mergerOf, baryCenterReduce, kineticObjsToBarycenter } from "./merge";
import { calcRForce } from "./repulse";

const interactions_cache = new InteractionsCacheHandler();
const calculateInteractions = (k1: KineticObj, k2: KineticObj) => {
	const distance = Vec.distanceSq(k1.pos, k2.pos);
	const net_force = netForceBetween(k1, k2, [() => calcGForce(k1, k2, distance)]);
	const accel_vecs = forceToAccelVecs(net_force, k1, k2);
	return { distance, net_force, accel_vecs };
};

const attractFullyGranular = (kinetic_objs: KineticObj[]) => {
	for (let i = 0; i < kinetic_objs.length - 1; ++i) {
		const k1 = kinetic_objs[i];
		if (k1.ghosted) continue;
		for (let j = i + 1; j < kinetic_objs.length; ++j) {
			const k2 = kinetic_objs[j];
			if (k2.ghosted) continue;

			// const [lo, hi] = interactions_cache.sortedCacheIndexesOf(k1, k2);
			// const { accel_vecs } = interactions_cache.readOrUpdate(lo, hi, () => calculateInteractions(k1, k2))[hi] as Filled<InteractionInfo>;

			const { accel_vecs } = calculateInteractions(k1, k2);

			k1.accelerate(accel_vecs[0]);
			k2.accelerate(accel_vecs[1]);
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

let old_cache: {[k: string]: {[k: string]: number }} = {};
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
				old_cache[k_obj.id] = old_cache[k_obj.id] ?? {};
				const lookup = old_cache[k_obj.id][other_obj.id];
				// console.log(`lookup for ${k_obj.id}-${other_obj.id}: ${lookup}`);
				const d2 = lookup ? lookup : Vec.distanceSq(k_obj.pos, other_obj.pos);
				if (!lookup) old_cache[k_obj.id][other_obj.id] = d2;
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

export let universe_bounding_rect: Rect | undefined;
export let universe_subrects: Rect[] | undefined;
type Cell = { rect: Rect, k_objs: KineticObj[], barycenter?: KineticObj, density: number };
export let universe_cells: Cell[] = [];
export let universe_subdivide_depth = 3;
export const GRANULARITY_BREAKPOINT = 400;
const updateUniverseRects = () => {
	if (kinetic_objs.length > GRANULARITY_BREAKPOINT) {
		const position_mags = kinetic_objs.map(k_obj => Vec.magnitude(k_obj.pos)).sort((m1, m2) => {
			if (m1 > m2) return 1;
			else if (m1 < m2) return -1;
			else return 0;
		});
		const percentile_pos_mag = position_mags[Math.ceil(position_mags.length * 0.95)];
		// console.log(`mag was at ${Math.floor(position_mags.length * 0.95)}, l = ${position_mags.length}`);
		universe_bounding_rect = kinetic_objs.reduce((vecs, k_obj) => {
			if (Vec.magnitude(k_obj.pos) > percentile_pos_mag) {
				// console.log(`ignore object ${k_obj.id}, |p| = ${Vec.magnitude(k_obj.pos)} (max is ${percentile_pos_mag})`);
				return vecs;
			}
			const [tl, br] = vecs;
			const lowest_x = k_obj.pos[0] < tl[0] ? k_obj.pos[0] : tl[0];
			const lowest_y = k_obj.pos[1] < tl[1] ? k_obj.pos[1] : tl[1];
			const highest_x = k_obj.pos[0] > br[0] ? k_obj.pos[0] : br[0];
			const highest_y = k_obj.pos[1] > br[1] ? k_obj.pos[1] : br[1];
			const larger = highest_x > highest_y ? highest_x : highest_y;
			return ([ [lowest_x, lowest_y], [larger, larger] ] as Rect).map((v: Vec) => Vec.mulScalar(v, 1)) as Rect;
		}, [ [0, 0], [0, 0] ]);

		universe_subrects = subDivideRect(universe_bounding_rect, universe_subdivide_depth);

		// console.log(universe_subrects);

		universe_cells = [];

		const cell_area = Vec.area(Vec.vecBetween(universe_bounding_rect[0], universe_bounding_rect[1]));
		for (let index = 0; index < universe_subrects.length; ++index) {
			const rect = universe_subrects[index];

			const objs = kinetic_objs.filter(k => pointInRect(k.pos, rect));
			// further subdivide the rect if its overpopulated

			universe_cells.push({
				rect,
				k_objs: objs,
				barycenter: objs.length ? kineticObjsToBarycenter(objs, `<B${index}>`) : undefined,
				density: objs.reduce((total, k) => total + k.mass, 0) / cell_area,
			});
		}

		
		// if (!overdensity) {
		// 	const density = avg_count / kinetic_objs.length;
		// 	if (density < 0.01) universe_subdivide_depth = Math.max(0, universe_subdivide_depth - 1);
		// } else {
		// 	universe_subdivide_depth = Math.min(4, universe_subdivide_depth + 1);
		// }
	}
};
setInterval(updateUniverseRects, 300);

const attractRectangleRegions = () => {
	if (universe_bounding_rect && universe_subrects) {

		const grid_cell_diagonal = Vec.distance(universe_bounding_rect![0], universe_bounding_rect![1]) / Math.pow(2, universe_subdivide_depth);
		universe_cells.forEach((cell, i) => {
			const neighbors = universe_cells.filter(other_cell => {
				// if (cell.barycenter && other_cell.barycenter) {
				// 	console.group(`is cell ${universe_cells.findIndex(uc => other_cell === uc)} neighbor of ${universe_cells.findIndex(uc => cell === uc)}`);
				// 	console.log(`dist is ${Vec.distance(cell.barycenter.pos, other_cell.barycenter.pos)}`);
				// 	console.log(`less than ${Vec.distance(universe_bounding_rect![0], universe_bounding_rect![1]) / Math.pow(2, universe_subdivide_depth)}?`);
				// 	console.log(Vec.distance(cell.barycenter.pos, other_cell.barycenter.pos) < Vec.distance(universe_bounding_rect![0], universe_bounding_rect![1]) / Math.pow(2, universe_subdivide_depth));
				// 	console.groupEnd();
				// }
				return cell === other_cell || (cell.barycenter &&
					   other_cell.barycenter &&
					   Vec.distance(cell.barycenter.pos, other_cell.barycenter.pos) < grid_cell_diagonal);
			});
			// console.log(`neighbors of index ${i} are ${neighbors.map((n) => universe_cells.findIndex(c => c === n)).reduce((s, i) => `${s}, ${i}`, ``)}`);
			// const neighbors = [cell, ...neighbor_indexes.map(index => universe_cells[index]).filter(cell => cell)];
			const others = universe_cells.filter(other_cell => {
				return !neighbors.includes(other_cell) &&
					cell.barycenter &&
					other_cell.barycenter &&
					Vec.distance(cell.barycenter.pos, other_cell.barycenter.pos) < grid_cell_diagonal * 3
			});
	
			// console.group(`for objs in cell ${i}`);
			// console.log(`${neighbors.length} neighbors`);
			// console.log(neighbors);
			// console.log(`${others.length} others`);
			// console.log(others);
			cell.k_objs.forEach((k1) => {
				if (!k1.ghosted) {
					// console.group(`obj ${k1.id}`);
					// console.log(`begin granular calcs`);
					for (let cell_idx = 0; cell_idx < neighbors.length; ++cell_idx) {
						const n_cell = neighbors[cell_idx];
						for (let k_idx = 0; k_idx < n_cell.k_objs.length; ++k_idx) {
							const k2 = n_cell.k_objs[k_idx];
							if (!k2.ghosted && k2.id !== k1.id) {
								// const [c1, c2] = interactions_cache.sortedCacheIndexesOf(k1, k2);
								// const { accel_vecs } = interactions_cache.readOrUpdate(c1, c2, () => calculateInteractions(k1, k2))[c2] as Filled<InteractionInfo>;
								const { accel_vecs } = calculateInteractions(k1, k2);

								k1.accelerate(accel_vecs[0]);
							}
						}
					}

					others.forEach(o_cell => {
						const B = o_cell.barycenter;
						
						if (B) {
							const F = netForceBetween(k1, B, [() => calcGForce(k1, B, Math.pow(Vec.distanceSq(k1.pos, B.pos), 1.2))]);
							// if (Math.random() < 0.1) {
								// console.log(`${k1.id}-${B.id}: ${F}`);
								// console.log(forceToAccelVecs(F, k1, B));
							// }
							const accel = forceToAccelVecs(F, k1, B)[0];
							k1.accelerate(accel);
						}
					});
					// console.groupEnd();
				}
			});
			// console.groupEnd();
		});

	}
};

export default (kinetic_objs: KineticObj[]) => {
	// console.log(`phys call`);
	if (kinetic_objs.length < 2) return;

	// let t1 = performance.now();	
	// attractFullyGranular(kinetic_objs);
	// let t2 = performance.now();
	// console.log(`time for granular: ${t2 - t1}`);
	
	// t1 = performance.now();
	// attractRectangleRegions(kinetic_objs);
	// t2 = performance.now();
	// console.log(`time for rects: ${t2 - t1}`);
	interactions_cache.flush();
	kinetic_objs.length < GRANULARITY_BREAKPOINT ? attractFullyGranular(kinetic_objs) : attractRectangleRegions();
	// console.log(interactions_cache);
};
