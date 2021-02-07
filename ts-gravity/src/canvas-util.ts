export const clearAllFn = (ctx: CanvasRenderingContext2D) => {
	return (colour?: string) => {
		const canvas = ctx.canvas;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (colour) {
			ctx.fillStyle = colour;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}
	};
};
