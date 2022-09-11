import { Vec } from "./Vec";

export const randArrIndex = (arr: unknown[]) => randInt(0, arr.length - 1);
export const randInt = (min: number = 50, max: number = 150) => Math.floor(Math.random() * (max - min + 1) + min);
export const randArrValue = <T>(arr: T[]) => arr[randArrIndex(arr)];

export const randVec = (min: number = 1, max: number = 5): Vec => {
	return [randInt(min, max), randInt(min, max)];
};