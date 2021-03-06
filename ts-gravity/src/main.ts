import { clearAllFn } from './canvas-util';
import KineticObj from './KineticObj';
import { gravitateBoth } from './Physics';
import Vec2 from './Vec2';

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
	window.requestAnimationFrame(main);
});

let playing = false;
let show_labels = false;
let n = 150;
const paused_controls = document.getElementById(`paused`)!;
const playing_controls = document.getElementById(`playing`)!;
const play_btn = document.getElementById(`play`)!;
const pause_btn = document.getElementById(`pause`)!;
const labels_btn = document.getElementById(`label-toggle`)!;
const new_sim_btn = document.getElementById(`new-sim`)!;
const count_input = document.getElementById(`obj-count`)! as HTMLInputElement;
count_input.value = `${n}`;

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
	kinetic_objs = Array.from({ length: n }, randKineticObj);
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

const clear = clearAllFn(ctx);

const randInt = (min: number = 50, max: number = 150) => Math.floor(Math.random() * (max - min + 1) + min);

const randVec2 = (min: number = 1, max: number = 5) => {
	return new Vec2(randInt(min, max), randInt(min, max));
};

const randKineticObj = () => {
	return new KineticObj(
		randInt(150, 1000),
		randVec2(50, 750),
		// randVec2(-0.3, 0.3)
		randVec2(0, 0),
	);
};

export let kinetic_objs = Array.from({ length: n }, randKineticObj);
// export const kinetic_objs = [
// 	new KineticObj(1000, new Vec2(200, 200), new Vec2(0.5, 0)),
// 	new KineticObj(1000, new Vec2(300, 300), new Vec2(0, 0))
// ];

const main = () => {
	clear(`black`);
	for (const [index, k_obj] of kinetic_objs.entries()) {
		ctx.beginPath();
		if (show_labels) {
			ctx.strokeText(`${index}`, k_obj.pos.x, k_obj.pos.y + (k_obj.mass / 100) + 12);
		}
		ctx.arc(k_obj.pos.x, k_obj.pos.y, Math.max(1, k_obj.mass / 100), 0, Math.PI * 2);
		ctx.stroke();
	}

	for (let i = 0; i < kinetic_objs.length - 1; ++i) {
		const k1 = kinetic_objs[i];
		for (let j = i + 1; j < kinetic_objs.length; ++j) {
			const k2 = kinetic_objs[j];
			gravitateBoth(k1, k2);
		}
	}

	kinetic_objs.forEach(k_obj => k_obj.update());
	window.requestAnimationFrame(playing === true ? main : () => { });
};

// window.requestAnimationFrame(() => {
// 	console.log(`go`);
// 	main();
// });
