import KineticObj from './KineticObj';
import Vec2 from './Vec2';
// execution phases
import makeRender from './phase/render';
import physics from './phase/physics';
import merge from './phase/merge';

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
	window.requestAnimationFrame(main);
	fillIndexTableRows();
});

let playing = false;
let show_labels = false;
let n = 5;

const paused_controls = document.getElementById(`paused`)!;
const playing_controls = document.getElementById(`playing`)!;
const play_btn = document.getElementById(`play`)!;
const pause_btn = document.getElementById(`pause`)!;
const labels_btn = document.getElementById(`label-toggle`)!;
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
		const pos = obj.pos.clone.sub(camera_origin);
		return click_pos.isProximateTo(pos, Math.max(10, obj.radius));
	});

	if (index !== -1) {
		selectObject(index);
	}
});
canvas.addEventListener(`keydown`, (ev) => {
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
		console.log(vec);
		camera_origin.add(Vec2.from(vec).multiply(pan_speed_scale));
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
});
new_sim_btn.addEventListener(`click`, () => {
	selection = null;
	nextId = makeIDFactory();
	kinetic_objs = Array.from({ length: n }, randKineticObj);
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


const randInt = (min: number = 50, max: number = 150) => Math.floor(Math.random() * (max - min + 1) + min);
const randArrIndex = (arr: unknown[]) => randInt(0, arr.length - 1);
const randArrValue = <T>(arr: T[]) => arr[randArrIndex(arr)];

const randVec2 = (min: number = 1, max: number = 5) => {
	return new Vec2(randInt(min, max), randInt(min, max));
};

const makeIDFactory = () => {
	let id = 0;
	return () => {
		return id++;
	};
};
let nextId = makeIDFactory();

const randKineticObj = function () {
	const sign = () => Math.random() > 0.5 ? 1 : -1;
	const velocity_mag = 10;
	const vx = sign() * randInt(0, velocity_mag);
	const vy = sign() * velocity_mag - vx;

	return new KineticObj(
		randInt(50, 300),
		randVec2(100, 700),
		// randVec2(-15, 15),
		randVec2(-0, 0),
		// new Vec2(vx, vy),
		nextId().toString(),
	);
};

const selectObject = (index: number) => {
	selection = kinetic_objs[index];

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

	const fields = [
		`mass`,
		`pos`,
		`velocity`
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
export let kinetic_objs = Array.from({ length: n }, randKineticObj);
export let selection: KineticObj | null = null;
// export const kinetic_objs = [
// 	new KineticObj(1000, new Vec2(200, 200), new Vec2(0.5, 0)),
// 	new KineticObj(1000, new Vec2(300, 300), new Vec2(0, 0))
// ];

const render = makeRender(ctx);

const main = async () => {
	if (selection && follow_selected_input.checked === true) {
		// console.log(`set camera: (${selection.pos.x}, ${selection.pos.y}) [index: ${selection.index}]`);
		camera_origin = selection.pos.clone.sub(400);
	} else {
		// camera_origin = new Vec2(0, 0);
	}
	// draw phase
	render(kinetic_objs, camera_origin, show_labels);
	// physics phase
	const selection_v1 = selection?.velocity;
	physics(kinetic_objs);
	const selection_v2 = selection?.velocity;

	// merge phase
	const mergers = merge(kinetic_objs);

	kinetic_objs.forEach(k_obj => k_obj.update());

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

	if (playing) {
		// await new Promise(res => setTimeout(res, 100));
		window.requestAnimationFrame(main);
	}
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
	`velocity`
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
			td.textContent = field !== `velocity` ? val.toString() : val.toString(2);
			tr.appendChild(td);
		});
		tr.addEventListener(`click`, () => {
			selectObject(index);
			follow_selected_input.checked = true;
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

// window.requestAnimationFrame(() => {
// 	console.log(`go`);
// 	main();
// });
