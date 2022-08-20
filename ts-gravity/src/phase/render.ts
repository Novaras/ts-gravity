import { clearAllFn } from "../canvas-util";
import KineticObj from "../KineticObj";
import Vec2 from "../Vec2";

const font_size = 12;

export const massToHSL = (mass: number) => {
	return {
		h: Math.min(mass / 200, 280),
		s: 90,
		l: Math.max(30, Math.min(mass / 1000, 60))
	};
};

export default (ctx: CanvasRenderingContext2D) => {
	const clear = clearAllFn(ctx);
	ctx.fillStyle = `white`;
	ctx.strokeStyle = `white`;
	return (kinetic_objs: KineticObj[], world_transform: Vec2, show_labels: boolean = false) => {
		clear(`black`);

		ctx.fillStyle = `white`;
		ctx.fillText(`n = ${kinetic_objs.length}`, 30, 15);
		ctx.fillText(`m = ${kinetic_objs.reduce((total, k_obj) => total + k_obj.mass, 0)}`, 150, 15);

		for (const k_obj of kinetic_objs) {
			const pos = k_obj.pos.clone.sub(world_transform);

			// console.log(`object ${index} at (${k_obj.pos.x}, ${k_obj.pos.y})`);
			// console.log(`\tmodified to: (${pos.x}, ${pos.y})`);
			
			if (show_labels) {
				ctx.fillStyle = `white`;
				const label_pos = {
					x: pos.x,
					y: pos.y + k_obj.radius,
				};
				
				ctx.fillText(`${k_obj.id}`, label_pos.x, label_pos.y + font_size);
				ctx.fillText(`${k_obj.mass}`, label_pos.x, label_pos.y + 2 * font_size);
				ctx.fillText(
					`(${k_obj.velocity.x.toFixed(2)}, ${k_obj.velocity.y.toFixed(2)})`,
					label_pos.x,
					label_pos.y + 3 * font_size
				);
			}

			const {h, s, l} = massToHSL(k_obj.mass);
			const obj_colour = `hsl(${h}deg, ${s}%, ${l}%)`;
			// console.log(`obj ${k_obj.id} drawn with hsl: ${obj_colour}`);
			ctx.strokeStyle = obj_colour;
			ctx.fillStyle = obj_colour;

			if (k_obj.radius >= 1) {
				ctx.beginPath();
				ctx.arc(pos.x, pos.y, k_obj.radius, 0, Math.PI * 2);
				ctx.stroke();
			} else {
				ctx.fillRect(pos.x, pos.y, 1, 1);
			}
		
		}
	};
};