import Vec2 from "./Vec2";

export const clearAllFn = (ctx: CanvasRenderingContext2D) => {
	const { width, height } = ctx.canvas;
	return (colour?: string) => {
		ctx.clearRect(0, 0, width, height);
		if (colour) {
			ctx.fillStyle = colour;
			ctx.fillRect(0, 0, width, height);
		}
	};
};
