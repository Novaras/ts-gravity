import Vec2 from "./Vec2";

export const randArrIndex = (arr: unknown[]) => randInt(0, arr.length - 1);
export const randInt = (min: number = 50, max: number = 150) => Math.floor(Math.random() * (max - min + 1) + min);
export const randArrValue = <T>(arr: T[]) => arr[randArrIndex(arr)];

export const randVec2 = (min: number = 1, max: number = 5) => {
	return new Vec2(randInt(min, max), randInt(min, max));
};