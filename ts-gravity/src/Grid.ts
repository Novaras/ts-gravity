import { Vec } from "./Vec";

export const indexToXYCoords = (i: number, grid_width: number): Vec => {
	return [
		i % grid_width,
		Math.floor(i / grid_width)
	];
};
export const xyCoordsToIndex = (xy: Vec, grid_width: number, grid_height = grid_width, clip_to_bounds = false) => {
	
	const [_x, _y] = ((): Vec => {
		if (clip_to_bounds) {
			return [
				Math.max(0, Math.min(grid_width - 1, xy[0])),
				Math.max(0, Math.min(grid_height - 1, xy[1]))
			];	
		} else {
			return xy;
		}
	})();
	if ((_x > 0 || _x < grid_width - 1) && (_y > 0 || _y < grid_height)) {
		return _x + (_y * grid_width);
	}
};
export const neighboringCellIndexes = <T>(grid: T[], index: number, depth: number = 1, grid_width = Math.sqrt(grid.length)): number[] => {
	const _fn = (i: number, recurse_depth: number): number[] => {
		const coords = indexToXYCoords(i, grid_width);
		// console.log(`search around ${Vec.toString(coords)}`)
		const dirs: Vec[] = [
			[0, -1],
			[1, 0],
			[0, 1],
			[-1, 0]
		];
		if (recurse_depth > 0) {
			// if we have more to do, we just do the normal computing of the indexes, then recurse on all those new indexes
			return [...dirs.reduce((acc, dir) => {
				const i = xyCoordsToIndex(Vec.add(coords, dir), grid_width);
				if (i) acc.push(i, ..._fn(i, recurse_depth - 1));
				return acc;
			}, [] as number[])];
		} else {
			return dirs.map(dir => xyCoordsToIndex(Vec.add(coords, dir), grid_width)).filter(i => i) as number[];
		}
	};
	// at the end we turn it all into a Set and back into an array, so every index is unique
	// also we remove the initial index
	return [...new Set(_fn(index, depth).filter(i => i !== index))];
};