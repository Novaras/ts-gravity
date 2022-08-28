import { clearAllFn } from "../canvas-util";
import KineticObj from "../KineticObj";
import Vec2 from "../Vec2";
import { STABLE_MASS_LIMIT } from "./decay";

type DrawableFn = `fillRect` | `strokeRect` | `arc` | `fillText` | `strokeText`;
type DrawableFnArgs = Parameters<CanvasRenderingContext2D[DrawableFn]>;
type Drawable = {
	drawFn: DrawableFn,
	drawFnArgs: DrawableFnArgs,
	fillStyle?: string,
	strokeStyle?: string,
};


const font_size = 12;

export const massToHSL = (mass: number) => {
	return {
		h: Math.min(mass / 4000, 240),
		s: 95,
		l: Math.max(30, Math.min(mass / 5000, 65))
	};
};

export default (ctx: CanvasRenderingContext2D) => {
	console.log(`render start`);
	const clear = clearAllFn(ctx);
	ctx.fillStyle = `white`;
	ctx.strokeStyle = `white`;
	const extra_to_draw: Drawable[] = [];
	return (kinetic_objs: KineticObj[], time: number, camera_origin: Vec2, camera_zoom_scale: number, show_labels: boolean, full_labels: boolean, largest_decay_mass?: number) => {
		clear();

		if (largest_decay_mass) {
			const max_brightness = Math.min(1, Math.max(0.1, (largest_decay_mass / (STABLE_MASS_LIMIT * 2))));
			const overlays = Array<Drawable>.from({ length: 100 }, (_, k) => ({
				drawFn: `fillRect` as DrawableFn,
				drawFnArgs: [0, 0, 800, 800] as Parameters<CanvasRenderingContext2D[`fillRect`]>,
				fillStyle: `hsla(${massToHSL(largest_decay_mass).h}, 100%, 95%, ${max_brightness - max_brightness * (k / 100)})`,
			}));
			extra_to_draw.push(...overlays);
		}

		ctx.fillStyle = `white`;
		const fillTextHAligned = (text: string, h_align: number, v_align: number, flip: boolean = false) => {
			const sign = flip ? -1 : 1;
			ctx.fillText(text, h_align + (sign * text.length * 3.5), v_align);
		};
		fillTextHAligned(`n = ${kinetic_objs.length}`, 10, 15);
		fillTextHAligned(`m = ${kinetic_objs.reduce((total, k_obj) => total + k_obj.mass, 0)}`, 10, 30);
		fillTextHAligned(`z = ${camera_zoom_scale.toFixed(4)}`, 790, 15, true);
		fillTextHAligned(`t = ${time}`, 10, 780);

		for (const k_obj of kinetic_objs) {
			const pos = k_obj.pos.clone.multiply(camera_zoom_scale).sub(camera_origin);
			const radius = k_obj.radius * camera_zoom_scale;

			// console.log(`object ${index} at (${k_obj.pos.x}, ${k_obj.pos.y})`);
			// console.log(`\tmodified to: (${pos.x}, ${pos.y})`);

			if (show_labels) {
				ctx.fillStyle = `white`;
				const label_pos = {
					x: pos.x,
					y: pos.y + radius,
				};

				ctx.fillText(`${k_obj.id}`, label_pos.x, label_pos.y + font_size);
				if (full_labels) {
					ctx.fillText(`${k_obj.mass}`, label_pos.x, label_pos.y + 2 * font_size);
					ctx.fillText(
						`(${k_obj.velocity.x.toFixed(2)}, ${k_obj.velocity.y.toFixed(2)})`,
						label_pos.x,
						label_pos.y + 3 * font_size
					);
				}
			}

			const { h, s, l } = massToHSL(k_obj.mass);
			const alpha = k_obj.ghosted ? 0.5 : 1;
			const obj_colour = `hsla(${h}deg, ${s}%, ${l}%, ${alpha})`;
			// console.log(`obj ${k_obj.id} drawn with hsl: ${obj_colour}`);
			ctx.strokeStyle = obj_colour;
			ctx.fillStyle = obj_colour;
			if (k_obj.mass > STABLE_MASS_LIMIT / 2) {
				// console.log(`${k_obj.id}: ${h}, ${s}, ${l}, ${alpha}`);
				ctx.shadowColor = `hsla(${h}deg, ${s}%, ${Math.max(50, l - 10)}%, 1)`;
				ctx.shadowBlur = Math.min(60, k_obj.mass / 2000);
				// ctx.shadowBlur = 10;
				// console.log(`blur: ${ctx.shadowBlur}`);
				ctx.lineWidth = 2;
			} else {
				ctx.lineWidth = 1;
				ctx.shadowBlur = 0;
			}

			if (radius >= 1) {
				ctx.beginPath();
				ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
				ctx.stroke();
			} else {
				ctx.fillRect(pos.x, pos.y, 1, 1);
			}
		}

		const drawable = extra_to_draw.shift();
		if (drawable) {
			console.log(`extra draw`);
			console.log(drawable);
			if (drawable.fillStyle) ctx.fillStyle = drawable.fillStyle;
			if (drawable.strokeStyle) ctx.strokeStyle = drawable.strokeStyle;

			const fn_name = drawable.drawFn;
			const draw_fn = ctx[fn_name];
			// @ts-ignore-line
			draw_fn.apply(ctx, drawable.drawFnArgs as DrawableFnArgs);
		}
	};
};