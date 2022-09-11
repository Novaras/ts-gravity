import { Vec } from "./Vec";

export type Rect = [Vec, Vec];

export const rectDims = (rect: Rect): Vec => ([rect[1][0] - rect[0][0], rect[1][1] - rect[0][1]]);
export const pointInRect = (point: Vec, rect: Rect) => (rect[0][0] < point[0] && rect[1][0] > point[0] && rect[0][1] < point[1] && rect[1][1] > point[1]);
export const centerOfRect = (rect: Rect) => [rect[0][0] + ((rect[1][0] - rect[0][0]) / 2), rect[0][1] + ((rect[1][1] - rect[0][1]) / 2)];
export const subDivideRect = (original: Rect, divisions: number = 1) => {
	// const total_divs = divisions;
	let rects = [original];
	// console.log(`started with rects:`);
	// console.log(rects);
	while (divisions > 0) {
		// console.log(`division ${total_divs - divisions}`);
		const new_rects: Rect[] = [];
		rects.forEach(rect => {
			const [tl, ] = rect;
			const [w, h] = rectDims(rect);
			const [ws, hs] = Vec.divScalar([w, h], 2);
			// console.group(`ok for initial rect {${Vec.toString(tl)}, ${Vec.toString(br)}}`);
			// console.log(`w = ${w}, h = ${h}`);
			// console.log(`ws = ${ws}, hs = ${hs}`);
			// console.groupEnd();
			new_rects.push(
				[[tl[0], tl[1]], [tl[0] + ws, tl[1] + hs]], // tl
				[[tl[0], tl[1] + hs], [tl[0] + ws, tl[1] + h]], // bl
				[[tl[0] + ws, tl[1]], [tl[0] + w, tl[1] + hs]], // tr
				[[tl[0] + ws, tl[1] + hs], [tl[0] + w, tl[1] + h]] // br
			);
		});
		rects = new_rects;
		// console.log(`new_rects:`);
		// console.log(new_rects);

		divisions -= 1;
	}
	return rects;
};