import { clearAllFn } from "../canvas-util";
import KineticObj from "../KineticObj";
import { angleBetweenPoints, calcGForce, forceToAccelVecs, netForceBetween, scalarHypToVec } from "../PhysicsLib";
import { Rect, rectDims, subDivideRect } from "../Rect";
import { Vec } from "../Vec";
import { STABLE_MASS_LIMIT } from "./decay";
import { GRANULARITY_BREAKPOINT, universe_bounding_rect, universe_cells } from "./physics";

type DrawableFn = `fillRect` | `strokeRect` | `arc` | `fillText` | `strokeText`;
type DrawableFnArgs = Parameters<CanvasRenderingContext2D[DrawableFn]>;
type Drawable = {
	drawFn: DrawableFn,
	drawFnArgs: DrawableFnArgs,
	fillStyle?: string,
	strokeStyle?: string,
};

// const [k1, k2,] = kinetic_objs;
// 	console.group(`${k1.id} <-> ${k2.id}`);
// 	const dist = Vec.distance(k1.pos, k2.pos);
// 	const g_force = calcGForce(k1, k2);
// 	const r_force = calcRForce(k1, k2);
// 	const net_force = g_force + r_force;
// 	const accels = forceToAccelVecs(net_force, k1, k2);
// 	console.log(`dist: ${dist}`);
// 	console.log(`Fg = ${g_force}\tFr = ${r_force}`);
// 	console.log(`F = ${net_force}`);
// 	console.log(`accels:`);
// 	console.log(accels);
// 	console.groupEnd();

const font_size = 12;
const selected_colour = `hsl(180, 80%, 70%)`;

export const massToHSL = (mass: number) => {
	return {
		h: Math.min(mass / 4000, 240),
		s: 95,
		l: Math.max(30, Math.min(mass / 5000, 65))
	};
};

const makeTextAlignFnFor = (ctx: CanvasRenderingContext2D) => (text: string, h_align: number, v_align: number, flip: boolean = false) => {
	const sign = flip ? -1 : 1;
	ctx.fillText(text, Math.floor(h_align + (sign * text.length * 3.5)), Math.floor(v_align));
};

const renderGridCanvas = (show_grid: boolean, grid_ctx: CanvasRenderingContext2D, camera_zoom_scale: number, camera_origin: Vec) => {
	const should_redraw_grid_canvas = show_grid && universe_bounding_rect && universe_cells.length && Math.floor(render_tick) % 13 === 0;
	if (should_redraw_grid_canvas) {
		console.log(`draw grid...`);
		const ctx = grid_ctx;
		clearAllFn(ctx)();
		universe_cells.forEach((cell, index) => {
			// console.log(`cell ${index}`);
			ctx.save();
			ctx.fillStyle = `white`;
			ctx.strokeStyle = `blue`;
			const r = cell.rect;
			const scaled = r.map((v: Vec) => Vec.map(Vec.sub(Vec.mulScalar(v, camera_zoom_scale), camera_origin), n => Math.round(n))) as Rect;
			ctx.strokeRect(scaled[0][0], scaled[0][1], ...rectDims(scaled));
			makeTextAlignFnFor(grid_ctx)(index.toString(), scaled[0][0] + 10, scaled[0][1] + 20 - 20 * (1 / camera_zoom_scale));
			ctx.restore();

			if (cell.barycenter) {
				ctx.save();
				const pos = Vec.sub(Vec.mulScalar(cell.barycenter.pos, camera_zoom_scale), camera_origin);
				ctx.fillStyle = `white`;
				ctx.strokeStyle = `white`;
				ctx.beginPath();
				ctx.moveTo(pos[0] - 10, pos[1]);
				ctx.lineTo(pos[0] + 10, pos[1]);
				ctx.moveTo(pos[0], pos[1] - 10);
				ctx.lineTo(pos[0], pos[1] + 10);
				ctx.stroke();
				ctx.fillText(`B${index}`, pos[0] + 5, pos[1] + 5);
				ctx.restore();
			}
		});
		
		const scaled = universe_bounding_rect!.map((v: Vec) => Vec.sub(Vec.mulScalar(v, camera_zoom_scale), camera_origin)) as Rect;

		ctx.strokeStyle = `green`;
		ctx.strokeRect(scaled[0][0], scaled[0][1], ...rectDims(scaled));
	}
};

const inOutQuadBlend = (v: number) => v < 0.5 ? (2 * Math.pow(v, 2)) : (2 * v * (1 - v) + 0.5);
let render_tick = 0;
export default (main_canvas: HTMLCanvasElement, grid_canvas: HTMLCanvasElement) => {
	const main_ctx = main_canvas.getContext(`2d`)!;
	const grid_ctx = grid_canvas.getContext(`2d`)!;
	console.log(`render start`);
	const clear = clearAllFn(main_ctx);
	main_ctx.fillStyle = `white`;
	main_ctx.strokeStyle = `white`;
	
	const extra_to_draw: Drawable[] = [];
	return (kinetic_objs: KineticObj[], time: number, camera_origin: Vec, camera_zoom_scale: number, show_labels: boolean, full_labels: boolean, show_grid: boolean, largest_decay_mass?: number, selected_obj?: KineticObj) => {
		clear();

		renderGridCanvas(show_grid, grid_ctx, camera_zoom_scale, camera_origin);
		if (show_grid && universe_cells.length) main_ctx.drawImage(grid_canvas, 0, 0);

		if (largest_decay_mass) {
			const max_brightness = Math.min(1, Math.max(0.1, (largest_decay_mass / (STABLE_MASS_LIMIT * 2))));
			const overlays = Array<Drawable>.from({ length: 100 }, (_, k) => ({
				drawFn: `fillRect` as DrawableFn,
				drawFnArgs: [0, 0, 800, 800] as Parameters<CanvasRenderingContext2D[`fillRect`]>,
				fillStyle: `hsla(${massToHSL(largest_decay_mass).h}, 100%, 95%, ${max_brightness - max_brightness * (k / 100)})`,
			}));
			extra_to_draw.push(...overlays);
		}

		main_ctx.fillStyle = `white`;
		
		const fillTextHAlignedMain = makeTextAlignFnFor(main_ctx);
		fillTextHAlignedMain(`n = ${kinetic_objs.length}`, 10, 15);
		fillTextHAlignedMain(`m = ${kinetic_objs.reduce((total, k_obj) => total + k_obj.mass, 0)}`, 10, 30);
		fillTextHAlignedMain(`z = ${camera_zoom_scale.toFixed(4)}`, 790, 15, true);
		fillTextHAlignedMain(`t = ${time}`, 10, 780);

		for (const k_obj of kinetic_objs) {
			const [pos_x, pos_y] = Vec.sub(Vec.mulScalar(k_obj.pos, camera_zoom_scale), camera_origin);
			const radius = k_obj.radius * camera_zoom_scale;

			if (show_labels) {

				main_ctx.fillStyle = k_obj.id !== selected_obj?.id ? `white` : selected_colour;
				const [label_x, label_y] = [pos_x, pos_y + radius];

				main_ctx.fillText(`${k_obj.id}`, label_x, label_y + font_size);
				if (full_labels) {
					if (selected_obj?.id === k_obj.id && kinetic_objs.length > 1) {
						const p1 = Vec.sub(Vec.mulScalar(selected_obj.pos, camera_zoom_scale), camera_origin);
						// make sure this line cant have mag > 10
						const vecBetweenMags = (vec: Vec, min: number, max: number): Vec => {
							const mag = Vec.magnitude(vec);
							if (mag < min) return Vec.mulScalar(Vec.unit(vec), min);
							else if (mag > max) return Vec.mulScalar(Vec.unit(vec), max);
							else return vec;
						};
						
						const drawLineBetween = (p1: Vec, p2: Vec, colour: string = selected_colour, width = 1) => {
							main_ctx.strokeStyle = colour;
							main_ctx.lineWidth = width;
							main_ctx.beginPath();
							main_ctx.moveTo(...p1);
							main_ctx.lineTo(...p2);
							main_ctx.stroke();
						}
	
						// console.clear();
						// const forceFn = () => calcGForce(selected_obj, k_obj, Vec.distanceSq(selected_obj.pos, k_obj.pos));

						const objs_by_net_force = kinetic_objs.filter(k_obj => k_obj.id !== selected_obj.id).slice();
						objs_by_net_force.sort((k1, k2) => {
							const [m1, m2] = [k1, k2].map(k => netForceBetween(selected_obj, k));
							// console.group(`comp ${k1.id} vs ${k2.id} force`);
							// console.log(m1, m2);
							// console.log(m1 > m2 ? `m1 (${k1.id}) wins` : `m2 (${k2.id}) wins`);
							// console.groupEnd();
							if (m1 > m2) return -1;
							else if (m1 < m2) return 1;
							else return 0;
						});

						// f = (GMm) / rr
						// f = (M+m)a
						// (GMm) / rr = (M+m)a
						// {0} = Ma + ma
						// 

						const highest_accel_mag = netForceBetween(selected_obj, objs_by_net_force[0]) / selected_obj.mass;
						// console.log(`highest was ${highest_accel_mag.toPrecision(4)} (between ${selected_obj.id} and ${objs_by_net_force[0].id})`);
						// console.group(`begin for ${selected_obj.id}`);
						// console.table(objs_by_net_force.slice(0, 8));
						objs_by_net_force.slice(0, 8).forEach((k_obj, i) => {
							// vec = k * (fvec / largest mag) (normalise to fraction of largest)
							// if (i === 0) console.log(`obj 0 confirm id: ${k_obj.id} - ${objs_by_net_accel[0].id}`);
							
							const theta = angleBetweenPoints(selected_obj.pos, k_obj.pos);
							const f_mag = netForceBetween(selected_obj, k_obj);
							const acc_mag = f_mag / selected_obj.mass;
							const acc_vec = scalarHypToVec(acc_mag, theta);
							const norm = Vec.divScalar(acc_vec, highest_accel_mag);
							const scaled = Vec.mulScalar(norm, 80);
							// console.log(`${i}-[${selected_obj.id}-${k_obj.id}]: try to draw accel ${Vec.toString(acc_vec)} (mag: ${acc_mag}) as ${Vec.toString(norm)}`);
							const p2 = Vec.add(p1, scaled);
							// console.log(fvec);
							// console.log(norm);

							// console.group(`draw line for ${k_obj.id}`);
							// console.log(`line: ${Vec.toString(p1)} - ${Vec.toString(p2)} (len: ${Vec.distance(p1, p2)})`);
							// console.log(`highest mag: ${highest_accel_mag}`);
							// console.table({
							// 	f_mag,
							// 	theta,
							// 	acc_mag,
							// 	acc_vec: `${Vec.toString(acc_vec)} (mag: ${Vec.magnitude(acc_vec)})`,
							// 	norm: `${Vec.toString(norm)} (mag: ${Vec.magnitude(norm)})`,
							// 	scaled: `${Vec.toString(scaled)} (mag: ${Vec.magnitude(scaled)})`
							// });
							// console.groupEnd();
							const style = `hsl(${1 + i * 240 / 8}deg, 70%, 50%)`;
							drawLineBetween(p1, p2, style, 1);
							const p3 = Vec.add(p2, Vec.mulScalar(Vec.unit(scaled), 12));
							main_ctx.fillStyle = style;
							main_ctx.fillText(`id=${k_obj.id}: ${Vec.magnitude(acc_vec).toPrecision(3)}`, p3[0], p3[1]);
						});
						// console.groupEnd();

					}
				}
			}

			const { h, s, l } = massToHSL(k_obj.mass);
			const alpha = k_obj.ghosted ? 0.5 : 1;
			const obj_colour = `hsla(${h}deg, ${s}%, ${l}%, ${alpha})`;
			// console.log(`obj ${k_obj.id} drawn with hsl: ${obj_colour}`);
			main_ctx.strokeStyle = obj_colour;
			main_ctx.fillStyle = obj_colour;
			if (k_obj.mass > STABLE_MASS_LIMIT / 2) {
				// console.log(`${k_obj.id}: ${h}, ${s}, ${l}, ${alpha}`);
				main_ctx.shadowColor = `hsla(${h}deg, ${s}%, ${Math.max(50, l - 10)}%, 1)`;
				main_ctx.shadowBlur = Math.min(60, k_obj.mass / 2000);
				// ctx.shadowBlur = 10;
				// console.log(`blur: ${ctx.shadowBlur}`);
				main_ctx.lineWidth = 2;
			} else {
				main_ctx.lineWidth = 1;
				main_ctx.shadowBlur = 0;
			}

			const int_pos = Vec.map([pos_x, pos_y], n => Math.round(n));
			if (radius >= 1) {
				main_ctx.beginPath();
				main_ctx.arc(int_pos[0], int_pos[1], radius, 0, Math.PI * 2);
				main_ctx.stroke();
			} else {
				main_ctx.fillRect(pos_x, pos_y, 2, 2);
			}
		}

		const drawable = extra_to_draw.shift();
		if (drawable) {
			// console.log(`extra draw`);
			// console.log(drawable);
			if (drawable.fillStyle) main_ctx.fillStyle = drawable.fillStyle;
			if (drawable.strokeStyle) main_ctx.strokeStyle = drawable.strokeStyle;

			const fn_name = drawable.drawFn;
			const draw_fn = main_ctx[fn_name];
			// @ts-ignore-line
			draw_fn.apply(main_ctx, drawable.drawFnArgs as DrawableFnArgs);
		}

		render_tick += 1;
	};
};