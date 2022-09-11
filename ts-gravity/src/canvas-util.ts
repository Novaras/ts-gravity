export const clearAllFn = (ctx: CanvasRenderingContext2D) => {
	const { width, height } = ctx.canvas;
	return (colour: string = `black`, alpha: number = 1) => {
		// ctx.clearRect(0, 0, width, height);
		if (colour) {
			ctx.fillStyle = colour;
			const previous_alpha = ctx.globalAlpha;
			ctx.globalAlpha = alpha ?? previous_alpha;
			ctx.fillRect(0, 0, width, height);
			ctx.globalAlpha = previous_alpha;
		} else {
			ctx.clearRect(0, 0, width, height);
		}
	};
};
