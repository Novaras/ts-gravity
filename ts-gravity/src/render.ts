import { clearAllFn } from "./canvas-util";
import KineticObj from "./KineticObj";

export default (ctx: CanvasRenderingContext2D) => {
	const clear = clearAllFn(ctx);
	return (kinetic_objs: KineticObj[], show_labels: boolean) => {
		clear(`black`);
		for (const [index, k_obj] of kinetic_objs.entries()) {
			ctx.beginPath();
			if (show_labels) {
				const label_pos = {
					x: k_obj.pos.x,
					y: k_obj.pos.y + k_obj.radius,
				};
				const font_size = 12;
				ctx.strokeText(`${index}`, label_pos.x, label_pos.y + font_size);
				ctx.strokeText(`${k_obj.mass}`, label_pos.x, label_pos.y + 2 * font_size);
				ctx.strokeText(
					`(${k_obj.velocity.x.toFixed(2)}, ${k_obj.velocity.y.toFixed(2)})`,
					label_pos.x,
					label_pos.y + 3 * font_size
				);
			}
			ctx.arc(k_obj.pos.x, k_obj.pos.y, Math.max(1, k_obj.radius), 0, Math.PI * 2);
			ctx.stroke();
		}
	};
};