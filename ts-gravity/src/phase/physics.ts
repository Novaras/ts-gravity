import { xyCoordsToIndex, neighboringCellIndexes, indexToXYCoords } from "../Grid";
import KineticObj from "../KineticObj";
import { kinetic_objs } from "../main";
import { accelerateBoth, angleBetweenPoints, calcGForce, forceToAccelVecs, forceVecBetween, netForceBetween, scalarHypToVec } from "../PhysicsLib";
import { pointInRect, Rect, subDivideRect } from "../Rect";
import { Vec } from "../Vec";
import { mergerOf, baryCenterReduce, kineticObjsToBarycenter } from "./merge";
import { calcRForce } from "./repulse";

let distances_chart: {[key: string]: {[key: string]: number}} = {};
const getCachedDist = (k1: KineticObj, k2: KineticObj) => {
	if (!distances_chart[k1.id]) distances_chart[k1.id] = {};
	distances_chart[k1.id][k2.id] = Math.pow(Vec.distance(k1.pos, k2.pos), 1.2);
	return distances_chart[k1.id][k2.id];
};

const attractFullyGranular = (kinetic_objs: KineticObj[]) => {
	distances_chart = {};
	for (let i = 0; i < kinetic_objs.length - 1; ++i) {
		const k1 = kinetic_objs[i];
		if (k1.ghosted) continue;
		for (let j = i + 1; j < kinetic_objs.length; ++j) {
			const k2 = kinetic_objs[j];
			if (k2.ghosted) continue;

			const d = getCachedDist(k1, k2);

			accelerateBoth(k1, k2, (k1, k2) => {
				const g = calcGForce(k1, k2, d);
				const r = calcRForce(k1, k2, d);

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

export let universe_bounding_rect: Rect | undefined;
export let universe_subrects: Rect[] | undefined;
type Cell = { rect: Rect, k_objs: KineticObj[], barycenter?: KineticObj };
export let universe_cells: Cell[] = [];
export let universe_subdivide_depth = 3;
export const GRANULARITY_BREAKPOINT = 300;
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

		console.log(universe_subrects)

		universe_cells = [];
		let avg_count = 0;
		let overdensity = false;
		for (let index = 0; index < universe_subrects.length; ++index) {
			const rect = universe_subrects[index];

			const objs = kinetic_objs.filter(k => pointInRect(k.pos, rect));
			// further subdivide the rect if its overpopulated
			avg_count = (avg_count + objs.length) / 2;
			if (objs.length > kinetic_objs.length / 20) {
				overdensity = true;
			}
			universe_cells.push({
				rect,
				k_objs: objs,
				barycenter: objs.length ? kineticObjsToBarycenter(objs) : undefined
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
setInterval(updateUniverseRects, 500);

const attractRectangleRegions = (kinetic_objs: KineticObj[]) => {
	if (universe_bounding_rect && universe_subrects) {
	
		distances_chart = {};
		const w = Math.sqrt(universe_cells.length);
		const neighbors_depth = 0;

		universe_cells.forEach((cell, i) => {
			const neighbor_indexes = neighboringCellIndexes(universe_cells, i, neighbors_depth, w);
			const neighbors = [cell, ...neighbor_indexes.map(index => universe_cells[index]).filter(cell => cell)];
			const others = universe_cells.reduce((others, cell) => {
				if (!neighbors.includes(cell)) others.push(cell);
				return others;
			}, [] as Cell[]);
	
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
								// console.log(`${k1.id}-${k2.id}`);
								const d = getCachedDist(k1, k2);
								const F = netForceBetween(k1, k2, [() => calcGForce(k1, k2, d)]);
								const [a1, a2] = forceToAccelVecs(F, k1, k2);
								k1.accelerate(a1);
								// k2.accelerate(a2);
							}
						}
					}

					others.forEach(o_cell => {
						const B = o_cell.barycenter;
						
						if (B) {
							const F = netForceBetween(k1, B, [() => calcGForce(k1, B, Math.pow(Vec.distance(k1.pos, B.pos), 1.2))]);
							// if (Math.random() < 0.1) {
							// 	console.log(`${k1.id}-${B.id}`);
							// 	console.log(F);
							// 	console.log(forceToAccelVecs(F, k1, B));
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

	kinetic_objs.length < GRANULARITY_BREAKPOINT ? attractFullyGranular(kinetic_objs) : attractRectangleRegions(kinetic_objs);
};
