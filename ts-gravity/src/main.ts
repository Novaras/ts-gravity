import KineticObj from './KineticObj';
import { Vec } from './Vec';
// execution phases
import makeRender from './phase/render';
import physics, { GRANULARITY_BREAKPOINT, universe_bounding_rect, universe_cells } from './phase/physics';
import merge from './phase/merge';
import decay from './phase/decay';
import { randInt, randVec } from './rand-util';
import { G, G_COEFF, G_EXPONENT, sortByMass, alterGCoeff, alterGExponent } from './PhysicsLib';
import { Rect, rectDims } from './Rect';

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
	// console.log(kinetic_objs);
	window.requestAnimationFrame(t => main(t, true));
	fillIndexTableRows();
});

let playing = false;
let show_labels = false;
let n = 100;
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
const selection_title_link_el = selection_info_display.querySelector(`#selection-title-link`)!;
const selection_info_active_cells = {} as {
	[key: string]: HTMLTableCellElement
};
const index_tbl_el = document.getElementById(`index-data`)!;
const index_tbl_el_fields = index_tbl_el.querySelector(`#index-data-fields`) as HTMLTableRowElement;
const index_tbl_el_rows = index_tbl_el.querySelector(`#index-data-rows`) as HTMLTableSectionElement;

const show_grid_input = document.getElementById(`show-grid`) as HTMLInputElement;

// G display
const g_display_el = document.getElementById(`g-constant`) as HTMLDivElement;
const g_coeff_input_el = document.getElementById(`g-coeff`) as HTMLInputElement;
const g_exponent_input_el = document.getElementById(`g-exponent`) as HTMLInputElement;
const g_total_display_el = document.getElementById(`g-constant-total`) as HTMLSpanElement;

canvas.addEventListener(`click`, (ev) => {
	const rect = canvas.getBoundingClientRect();
	const x = ev.clientX - rect.left;
	const y = ev.clientY - rect.top;
	// console.log("x: " + x + " y: " + y);
	const click_pos: Vec = [x, y];
	const index = kinetic_objs?.findIndex(obj => {
		const pos = Vec.sub(Vec.mulScalar(obj.pos, camera_zoom), camera_origin);
		return Vec.proximate(click_pos, pos, Math.max(15, obj.radius * camera_zoom * 1.2));
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
		// console.log(`changing zoom...`);
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
			camera_origin = Vec.add(camera_origin, Vec.mulScalar(vec, pan_speed_scale * Math.pow(camera_zoom, -0.5)));
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
	selection = undefined;
	nextId = makeIDFactory();
	kinetic_objs = Array.from({ length: n }, randKineticObj);
	t = 0;
	console.log(kinetic_objs);
});
count_input.addEventListener(`change`, (ev) => {
	n = parseInt((ev.target as HTMLInputElement).value);
	if (n > kinetic_objs.length) {
		for (let i = kinetic_objs.length; i < n; ++i) {
			kinetic_objs.push(randKineticObj());
		}
	} else if (n < kinetic_objs.length) {
		kinetic_objs = kinetic_objs.slice(0, n);
	}
});
selection_title_link_el.addEventListener(`click`, (ev) => {
	follow_selected_input.checked = true;
});

// G display events
g_total_display_el.textContent = G().toFixed(2);
g_coeff_input_el.value = G_COEFF.toFixed(2);
g_coeff_input_el.addEventListener(`change`, (ev) => {
	const v = parseFloat((ev.target as HTMLInputElement).value);
	alterGCoeff(v);
	g_total_display_el.textContent = G().toFixed(2);
});
g_exponent_input_el.value = G_EXPONENT.toFixed(2);
g_exponent_input_el.addEventListener(`change`, (ev) => {
	const v = parseFloat((ev.target as HTMLInputElement).value);
	alterGExponent(v);
	g_total_display_el.textContent = G().toFixed(2);
});
// make the boxes autofit the content
[g_coeff_input_el, g_exponent_input_el].forEach(el => {
	el.addEventListener(`input`, (ev) => {
		const tmp_el = document.createElement(`span`);
		tmp_el.style.display = `block`;
		tmp_el.style.visibility = `hidden`;
		tmp_el.style.fontSize = el.style.fontSize;
		document.body.append(tmp_el);
		const v = parseFloat((ev.target as HTMLInputElement).value);
		tmp_el.textContent = v.toFixed(2);
		console.log(`v = ${v.toFixed(2)}, w = ${tmp_el.clientWidth}px`);
		el.style.width = `${tmp_el.clientWidth + 20}px`;
		tmp_el.remove();
	});
	el.size = 5;
});

const makeIDFactory = () => {
	let id = 0;
	return () => {
		return (id++).toString();
	};
};
let nextId = makeIDFactory();

const randKineticObj = function () {
	const sign = () => Math.random() > 0.5 ? 1 : -1;
	const velocity_mag = 1 * Math.random();
	const vx = sign() * randInt(0, velocity_mag);
	const vy = sign() * velocity_mag - Math.abs(vx);

	return new KineticObj(
		randInt(300, 10000),
		// randVec(200, 600),
		randVec(-500 * n, 500 * n),
		// randVec(-15, 15),
		// randVec(-0, 0),
		[vx, vy],
		nextId(),
	);
};

const selectObject = (index: number) => {
	selection = kinetic_objs[index];

	if (!selection) return;

	selection_info_display.classList.add(`show`);

	selection_title_link_el.textContent = `Object ${selection!.id.toString()}`;

	const table_el = selection_info_display.querySelector(`#selection-info-display`)!;
	const table_data_fields_row_el = table_el.querySelector(`#selection-info-data-fields`)!;
	const table_data_values_row_el = table_el.querySelector(`#selection-info-data-values`)!;
	[...table_data_fields_row_el.children].forEach(el => el.remove());
	[...table_data_values_row_el.children].forEach(el => el.remove());

	const fields = [
		`mass`,
		`pos`,
		`velocity`,
		`age`,
		`ghosted`
	] as const;
	fields.forEach((field: typeof fields[number]) => {
		const field_cell_el = document.createElement(`th`);
		field_cell_el.textContent = `${field.charAt(0).toUpperCase()}${field.slice(1)}`;
		table_data_fields_row_el.appendChild(field_cell_el);

		const value_cell_el = document.createElement(`td`);
		const val = selection![field];
		value_cell_el.textContent = (val instanceof Array) ? Vec.toString(val) : val.toString();
		table_data_values_row_el.appendChild(value_cell_el);

		selection_info_active_cells[field] = value_cell_el;
	});
};

/** camera origin is the top-left corner! */
export let camera_origin: Vec = [0, 0];
export let camera_zoom = 0.01;
export let kinetic_objs = Array.from({ length: n }, randKineticObj);
export let selection: KineticObj | undefined;


const grid_canvas = document.createElement(`canvas`);
grid_canvas.width = canvas.width;
grid_canvas.height = canvas.height;
const render = makeRender(canvas, grid_canvas);

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
		selection_title_link_el.textContent = `Object ${selection.id.toString()}`;
		for (const [field, cell_el] of Object.entries(selection_info_active_cells)) {
			const val = selection[field as keyof KineticObj]!;
			cell_el.textContent = (val instanceof Array) ? Vec.toString(val) : val.toString();
		}
	} else if (selection_info_display.classList.contains(`show`)) {
		selection_info_display.classList.remove(`show`);
	}
};

const waitForMs = (ms: number = (1000 / 40)) => new Promise(res => setTimeout(res, ms));


const main = async (time: number, single_pass: boolean = false) => {
	const timeout = waitForMs();

	if (selection && follow_selected_input.checked === true) {
		// console.log(`set camera: (${selection.pos.x}, ${selection.pos.y}) [index: ${selection.index}]`);
		camera_origin = Vec.subScalar(Vec.mulScalar(selection.pos, camera_zoom), 400);
	} else {
		// camera_origin = [0, 0];
	}


	const decayed = [];
	if (playing || single_pass) {
		if (kinetic_objs.length > 1) {
			// physics phase
			physics(kinetic_objs);

			// merge phase
			const mergers = merge(kinetic_objs);

			updateSelectedInfoBox(mergers);

			decayed.push(...decay(kinetic_objs, nextId));
		}

		kinetic_objs.forEach(k_obj => k_obj.update());
		t += 1;
	}

	render(kinetic_objs, Math.floor(t), camera_origin, camera_zoom, show_labels, full_labels_input.checked, show_grid_input.checked, decayed.sort(sortByMass).at(0)?.mass, selection);
	

	await timeout;
	window.requestAnimationFrame(main);
};

// === table stuff here ===

const index_table_refresh_ms = 5000;
let index_tbl_sort_field: keyof KineticObj = `mass`;
const indexTblSortFn = (k1: KineticObj, k2: KineticObj) => {
	const field = index_tbl_sort_field;
	const [v1, v2] = [k1, k2].map((k) => {
		const v = k[field];
		if (v instanceof Array) return Vec.magnitude(v);
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
	// console.log(`table draw`);
	index_tbl_el_rows.innerHTML = ``;
	const fragment = document.createDocumentFragment();
	kinetic_objs.sort(indexTblSortFn).forEach((k_obj, index) => {
		const tr = document.createElement(`tr`);
		index_table_fields.forEach(field => {
			const td = document.createElement(`td`);
			const val = k_obj[field];
			if (field === `radius`) {
				td.textContent = Math.round(val as number).toString();
			} else if (val instanceof Array) {
				td.textContent = Vec.toString(val);
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

// window.requestAnimationFrame(() => {
// 	console.log(`go`);
// 	main();
// });
