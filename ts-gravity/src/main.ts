import KineticObj from './KineticObj';
import Vec2 from './Vec2';
// execution phases
import makeRender from './phase/render';
import physics from './phase/physics';
import merge from './phase/merge';
import decay from './phase/decay';
import { randInt } from './rand-util';
import { alignAccelVec, angleBetweenPoints, calcGForce, scalarHypToVec, sortByMass } from './PhysicsLib';
import { calcRForce } from './phase/repulse';

console.log(`from ts-gravity`);
const canvas = document.getElementById(`canvas`) as HTMLCanvasElement;
canvas.width = 800;
canvas.height = 800;
const ctx = canvas.getContext(`2d`)!;

ctx.strokeStyle = `white`;
ctx.font = `13px consolas`;
ctx.textAlign = `center`;

const adv_btn = document.getElementById(`advance-frame`)!;
adv_btn.addEventListener(`click`, () => {
	console.log(kinetic_objs);
	window.requestAnimationFrame(t => main(t, true));
	fillIndexTableRows();
	printPrimaryInteraction(true);
});

let playing = false;
let show_labels = false;
let n = 20;
let t = 0;

const paused_controls = document.getElementById(`paused`)!;
const playing_controls = document.getElementById(`playing`)!;
const play_btn = document.getElementById(`play`)!;
const pause_btn = document.getElementById(`pause`)!;
const labels_btn = document.getElementById(`label-toggle`)!;
const full_labels_div = document.getElementById(`show-full-labels`);
const full_labels_input = document.getElementById(`full-labels`) as HTMLInputElement;
const new_sim_btn = document.getElementById(`new-sim`)!;
const count_input = document.getElementById(`obj-count`)! as HTMLInputElement;
count_input.value = `${n}`;
const follow_selected_input = document.getElementById(`follow-selected`) as HTMLInputElement;
const selection_info_display = document.getElementById(`selection-info`)!;
const title_link_el = selection_info_display.querySelector(`#selection-title-link`)!;
const selection_info_active_cells = {} as {
	[key: string]: HTMLTableCellElement
};
const index_tbl_el = document.getElementById(`index-data`)!;
const index_tbl_el_fields = index_tbl_el.querySelector(`#index-data-fields`) as HTMLTableRowElement;
const index_tbl_el_rows = index_tbl_el.querySelector(`#index-data-rows`) as HTMLTableSectionElement;

canvas.addEventListener(`click`, (ev) => {
	const rect = canvas.getBoundingClientRect();
	const x = ev.clientX - rect.left;
	const y = ev.clientY - rect.top;
	console.log("x: " + x + " y: " + y);
	const click_pos = new Vec2(x, y);
	const index = kinetic_objs?.findIndex(obj => {
		const pos = obj.pos.clone.multiply(camera_zoom).sub(camera_origin);
		return click_pos.isProximateTo(pos, Math.max(15, obj.radius * camera_zoom * 1.2));
	});

	if (index !== -1) {
		selectObject(index);
	}
});
canvas.addEventListener(`keydown`, (ev) => {
	const key = ev.key.toLowerCase();

	// console.log(key);

	if (ev.ctrlKey && [`-`, `=`].includes(key)) {
		ev.preventDefault();
		if (key === `=`) camera_zoom *= 1.1;
		else camera_zoom = Math.max(0, camera_zoom * 0.9);
	} else {
		const arrow_vectors: { [key: string]: [number, number] } = {
			arrowup: [0, -1],
			arrowdown: [0, 1],
			arrowright: [1, 0],
			arrowleft: [-1, 0]
		};

		const pan_speed_scale = 10;
		const vec = arrow_vectors[ev.key.toLowerCase()];

		if (vec) {
			ev.preventDefault();
			camera_origin.add(Vec2.from(vec).multiply(pan_speed_scale * Math.pow(camera_zoom, -0.5)));
		}
	}
});

play_btn.addEventListener(`click`, () => {
	paused_controls.style.display = `none`;
	playing_controls.style.display = `inline-block`;
	playing = true;
	window.requestAnimationFrame(main);
});
pause_btn.addEventListener(`click`, () => {
	paused_controls.style.display = `inline-block`;
	playing_controls.style.display = `none`;
	playing = false;
});
labels_btn.addEventListener(`click`, () => {
	show_labels = !show_labels;
	show_labels ? full_labels_div?.classList.remove(`d-none`) : full_labels_div?.classList.add(`d-none`);
});
new_sim_btn.addEventListener(`click`, () => {
	selection = null;
	nextId = makeIDFactory();
	kinetic_objs = Array.from({ length: n }, randKineticObj);
	t = 0;
	console.log(kinetic_objs);
});
count_input.addEventListener(`input`, (ev) => {
	n = parseInt((ev.target as HTMLInputElement).value);
	if (n > kinetic_objs.length) {
		for (let i = kinetic_objs.length; i < n; ++i) {
			kinetic_objs.push(randKineticObj());
		}
	} else if (n < kinetic_objs.length) {
		kinetic_objs = kinetic_objs.slice(0, n);
	}
});
title_link_el.addEventListener(`click`, (ev) => {
	follow_selected_input.checked = true;
});

const randVec2 = (min: number = 1, max: number = 5) => {
	return new Vec2(randInt(min, max), randInt(min, max));
};

const makeIDFactory = () => {
	let id = 0;
	return () => {
		return (id++).toString();
	};
};
let nextId = makeIDFactory();

const randKineticObj = function () {
	const sign = () => Math.random() > 0.5 ? 1 : -1;
	const velocity_mag = 30 * Math.random();
	const vx = sign() * randInt(0, velocity_mag);
	const vy = sign() * velocity_mag - vx;

	return new KineticObj(
		randInt(100, 500),
		// randVec2(200, 600),
		randVec2(-10500, 10500),
		// randVec2(-15, 15),
		// randVec2(-0, 0),
		new Vec2(vx, vy),
		nextId(),
	);
};

const selectObject = (index: number) => {
	selection = kinetic_objs[index];

	if (!selection) return;

	selection_info_display.classList.add(`show`);

	title_link_el.textContent = `Object ${selection!.id.toString()}`;

	const table_el = selection_info_display.querySelector(`#selection-info-display`)!;
	const table_data_fields_row_el = table_el.querySelector(`#selection-info-data-fields`)!;
	const table_data_values_row_el = table_el.querySelector(`#selection-info-data-values`)!;
	[...table_data_fields_row_el.children].forEach(el => el.remove());
	[...table_data_values_row_el.children].forEach(el => el.remove());

	console.log(`generating table`);
	console.log(selection);
	console.log(selection_info_display);

	const fields: Readonly<(keyof KineticObj)[]> = [
		`mass`,
		`pos`,
		`velocity`,
		`age`,
		`acceleration`
	] as const;
	fields.forEach((field: typeof fields[number]) => {
		const field_cell_el = document.createElement(`th`);
		field_cell_el.textContent = `${field.charAt(0).toUpperCase()}${field.slice(1)}`;
		table_data_fields_row_el.appendChild(field_cell_el);

		const value_cell_el = document.createElement(`td`);
		console.log(`write ${field} to cell ${value_cell_el}`);
		const val = selection![field];
		value_cell_el.textContent = field !== `velocity` ? val.toString() : val.toString(2);
		table_data_values_row_el.appendChild(value_cell_el);

		selection_info_active_cells[field] = value_cell_el;
	});
};

/** camera origin is the top-left corner! */
export let camera_origin = new Vec2(0, 0);
export let camera_zoom = 1;

// export let kinetic_objs = Array.from({ length: n }, randKineticObj);
export let kinetic_objs = [
	new KineticObj(500, new Vec2(200, 200), new Vec2(0, 0), `0`),
	new KineticObj(500, new Vec2(200, 600), new Vec2(-0, 0), `1`),
	new KineticObj(500, new Vec2(600, 200), new Vec2(-0, 0), `2`),
	new KineticObj(500, new Vec2(600, 600), new Vec2(-0, 0), `3`)
];
// export let kinetic_objs = [
// 	new KineticObj(500, new Vec2(400, 400), new Vec2(0.0, -0.2), `0`),
// 	new KineticObj(500, new Vec2(300, 300), new Vec2(-0.0, 0.2), `1`),
// ];

export let selection: KineticObj | null = null;

const render = makeRender(ctx);

const updateSelectedInfoBox = (mergers: [string, string][]) => {
	if (selection) {
		const merge_pair = mergers.find(pair => pair.includes(selection!.id));
		// if selection was part of a merger it may have been removed
		if (merge_pair) {
			if (!kinetic_objs.find(k_obj => k_obj.id === selection!.id)) {
				const other_id = merge_pair.find(id => id !== selection!.id);
				const index = kinetic_objs.findIndex(k_obj => k_obj.id === other_id);
				selectObject(index);
			}
		}
		title_link_el.textContent = `Object ${selection.id.toString()}`;
		for (const [field, cell_el] of Object.entries(selection_info_active_cells)) {
			cell_el.textContent = selection[field as keyof KineticObj]!.toString();
		}
	} else if (selection_info_display.classList.contains(`show`)) {
		selection_info_display.classList.remove(`show`);
	}
};

const main = async (time: number, single_pass: boolean = false) => {
	if (selection && follow_selected_input.checked === true) {
		// console.log(`set camera: (${selection.pos.x}, ${selection.pos.y}) [index: ${selection.index}]`);
		camera_origin = selection.pos.clone.multiply(camera_zoom).sub(400);
	} else {
		// camera_origin = new Vec2(0, 0);
	}


	const decayed = [];
	if (playing || single_pass) {
		// physics phase
		const selection_v1 = selection?.velocity;
		physics(kinetic_objs);
		const selection_v2 = selection?.velocity;

		// merge phase
		const mergers = merge(kinetic_objs);
		updateSelectedInfoBox(mergers);

		decayed.push(...decay(kinetic_objs, nextId));

		kinetic_objs.forEach(k_obj => k_obj.update());
		t += 1;
	}

	// draw phase
	render(kinetic_objs, t, camera_origin, camera_zoom, show_labels, full_labels_input.checked, decayed.sort(sortByMass).at(0)?.mass);

	window.requestAnimationFrame(main);
};

// === table stuff here ===

const index_table_refresh_ms = 1500;
let index_tbl_sort_field: keyof KineticObj = `mass`;
const indexTblSortFn = (k1: KineticObj, k2: KineticObj) => {
	const field = index_tbl_sort_field;
	const [v1, v2] = [k1, k2].map((k) => {
		const v = k[field];
		if (v instanceof Vec2) return v.magnitude;
		else if (field === `id`) return parseInt(v as string);
		else return v;
	});
	if (v1 > v2) return -1;
	else if (v1 < v2) return 1;
	return 0;
};
const index_table_fields: (keyof KineticObj)[] = [
	`id`,
	`mass`,
	`pos`,
	`velocity`,
	`radius`
];
index_table_fields.forEach(field => {
	const td = document.createElement(`td`);
	td.textContent = `${field.charAt(0).toUpperCase()}${field.slice(1)}`;
	if (index_tbl_sort_field === field) {
		td.classList.add(`sort-by`);
	}
	td.addEventListener(`click`, () => {
		index_tbl_sort_field = field;
		fillIndexTableRows();
	});
	index_tbl_el_fields.appendChild(td);
});

const fillIndexTableRows = async () => {
	console.log(`table draw`);
	index_tbl_el_rows.innerHTML = ``;
	const fragment = document.createDocumentFragment();
	kinetic_objs.sort(indexTblSortFn).forEach((k_obj, index) => {
		const tr = document.createElement(`tr`);
		index_table_fields.forEach(field => {
			const td = document.createElement(`td`);
			const val = k_obj[field];
			if (field === `velocity`) {
				td.textContent = val.toString(2);
			} else if (field === `radius`) {
				td.textContent = Math.round(val as number).toString();
			} else {
				td.textContent = val.toString();
			}
			tr.appendChild(td);
		});
		tr.addEventListener(`click`, () => {
			selectObject(index);
			follow_selected_input.checked = true;
			canvas.focus();
		});
		fragment.appendChild(tr);
	});
	index_tbl_el_rows.appendChild(fragment);
};

setInterval(() => {
	if (playing) {
		fillIndexTableRows();
	}
}, index_table_refresh_ms);


const printPrimaryInteraction = (single_pass: boolean = false) => {
	if (playing || single_pass) {
		const k1 = kinetic_objs[0];
		const k2 = kinetic_objs[1];

		if (k1 && k2) {
			const g = calcGForce(k1, k2);
			const r = calcRForce(k1, k2);

			const f_limit = Infinity;
			let f = g + r;
			if (Math.abs(f) > f_limit) f = (Math.abs(f) / f) * f_limit;

			const sign = f >= 0 ? 1 : -1;
			const t = angleBetweenPoints(k1.pos, k2.pos);
			const [a1, a2] = [f / k1.mass, f / k2.mass];

			const av1 = Vec2.from(alignAccelVec(scalarHypToVec(a1, t), k2.pos, k1.pos, sign));
			const av2 = Vec2.from(alignAccelVec(scalarHypToVec(a2, t), k1.pos, k2.pos, sign));

			console.group(`${k1.id} <-> ${k2.id}`);
			console.log(`dist: ${Vec2.distance(k1.pos, k2.pos)}`)
			console.log(`g: ${g}\tr: ${r}`);
			console.log(`f: ${f}`);
			console.log(`t: ${t}`);
			console.log(`a1: ${a1.toFixed(4)}\ta2: ${a2.toFixed(4)}`);
			console.log(`av1: ${av1.toString(4)}\tav2: ${av2.toString(4)}`);
			console.groupEnd();
		}
	}
};
setInterval(printPrimaryInteraction, 200);

// window.requestAnimationFrame(() => {
// 	console.log(`go`);
// 	main();
// });
