import { clearAllFn } from "../canvas-util";
import KineticObj from "../KineticObj";
import Vec2 from "../Vec2";

export default (ctx: CanvasRenderingContext2D) => {
	const clear = clearAllFn(ctx);
	return (kinetic_objs: KineticObj[], world_transform: Vec2, show_labels: boolean = false) => {
		clear(`black`);
		ctx.fillStyle = `white`;
		for (const k_obj of kinetic_objs) {
			const pos = k_obj.pos.clone.sub(world_transform);

			// console.log(`object ${index} at (${k_obj.pos.x}, ${k_obj.pos.y})`);
			// console.log(`\tmodified to: (${pos.x}, ${pos.y})`);

			
			if (show_labels) {
				const label_pos = {
					x: pos.x,
					y: pos.y + k_obj.radius,
				};
				const font_size = 12;
				ctx.strokeText(`${k_obj.id}`, label_pos.x, label_pos.y + font_size);
				ctx.strokeText(`${k_obj.mass}`, label_pos.x, label_pos.y + 2 * font_size);
				ctx.strokeText(
					`(${k_obj.velocity.x.toFixed(2)}, ${k_obj.velocity.y.toFixed(2)})`,
					label_pos.x,
					label_pos.y + 3 * font_size
				);
			}
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