import KineticObj from "./KineticObj";
import { Vec } from "./Vec";

export type InteractionInfo = {
	distance?: number,
	net_force?: number,
	accel_vecs?: [Vec, Vec],
};

export type InteractionInfoDict = { [key: string]: InteractionInfo };
export type InteractionInfoSrc = Partial<InteractionInfo> | (() => Partial<InteractionInfo>);
export type InteractionCache = { [key: string]: { [key: string]: InteractionInfo }};
export class InteractionsCacheHandler {
	constructor(private _cache: InteractionCache = {}) {}

	public sortedCacheIndexesOf(k1: KineticObj, k2: KineticObj) {
		return k1.id > k2.id ? [k1.id, k2.id] : [k2.id, k1.id];
	}

	public create(low_idx: string, high_idx?: string, src?: InteractionInfoSrc) {
		const info = typeof src === `function` ? src() : src;
		this._cache[low_idx] = {};
		if (high_idx) this._cache[low_idx][high_idx] = info ?? {};
		return this.read(low_idx) as InteractionInfoDict;
	}

	public read(low_idx: string): InteractionInfoDict | undefined {
		if (!this._cache[low_idx]) return;
		return this._cache[low_idx];
	}

	public readOrCreate(low_idx: string, high_idx?: string, info?: InteractionInfoSrc) {
		const existing = this.read(low_idx);
		return !existing ? this.create(low_idx, high_idx, info) : existing;
	}

	public update(low_idx: string, high_idx?: string, src?: InteractionInfoSrc) {
		const info = typeof src === `function` ? src() : src;
		if (high_idx && info) {
			if (!this._cache[low_idx]) this._cache[low_idx] = {};
			const line = this._cache[low_idx];
			line[high_idx] = info;
		}
		return this.read(low_idx) as InteractionInfoDict;
	}

	public readOrUpdate(low_idx: string, high_idx?: string, src?: InteractionInfoSrc) {
		const existing_info = this.readOrCreate(low_idx);
		if (high_idx && !existing_info[high_idx]) {
			return this.update(low_idx, high_idx, src);
		}
		return existing_info as InteractionInfoDict;
	}

	public destroy(low_idx: string, high_idx?: string) {
		if (high_idx) {
			delete this._cache[low_idx][high_idx];
		} else {
			delete this._cache[low_idx];
		}
		return this.read(low_idx);
	}

	public flush() {
		this._cache = {};
	}
}
