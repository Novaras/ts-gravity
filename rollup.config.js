// rollup.config.js

import typescript from 'rollup-plugin-typescript2';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
	input: './ts-gravity/build/main.js',
	output: {
		file: './bundle.js',
		format: 'iife',
		name: `tsgravity`
	},
	plugins: [
		typescript({

		}),
		sourcemaps(),
	],
};