const production = !process.env.ROLLUP_WATCH
const terserOptions = {
	ecma: 2015,
	mangle: {
		properties: {
			regex:
				/^(duration|easing|delay|activeItem|calculateDimensions|dirty|tick|preloadNext|opts|prev|next|close|loadImage|smallScreen|props|setResizeFunc|before_update|after_update|ctx|\$\$set|\$set|invalidate|skip_bound|callbacks|on_disconnect|on_mount|not_equal|on_destroy|fragment|\$\$)$/,
		},
	},
	compress: {
		booleans_as_integers: true,
		pure_getters: true,
		drop_console: true,
		unsafe: true,
		unsafe_arrows: true,
		unsafe_comps: true,
		unsafe_Function: true,
		unsafe_math: true,
		unsafe_symbols: true,
		unsafe_methods: true,
		unsafe_proto: true,
		unsafe_regexp: true,
		unsafe_undefined: true,
		passes: 3,
	},
}

/*
rm unneeded svelte stuff for vanilla scripts (hacky but saves a few bytes)
need to re-test / modify if svelte is updated
*/
const cleanSvelteWhitespace = {
	markup: ({ content }) => {
		const code = content
			.replace(/(>)[\s]*([<{])/g, '$1$2')
			.replace(/({[/:][a-z]+})[\s]*([<{])/g, '$1$2')
			.replace(/({[#:][a-z]+ .+?})[\s]*([<{])/g, '$1$2')
			.replace(/([>}])[\s]+(<|{[/#:][a-z][^}]*})/g, '$1$2')
		return { code }
	},
}
/*const findReplaceOptions = [
	[/^\s*validate_store.+$|throw.+interpolate.+$/gm, ''],
	['if (options.hydrate)', 'if (false)'],
	['if (options.intro)', 'if (false)'],
	[`, important ? 'important' : ''`, ''],
	[/if \('props' in \$\$props.+;$/gm, ''],
	[/\$\$self\.\$\$set = \$\$props => {\s+};$/gm, ''],
	[
		/if \(type === 'object'\) {(.|\n)+if \(type === 'number'\)/gm,
		`if (type === 'number')`,
	],
	[': blank_object()', ': {}'],
	['__svelte', '_bp'],
	[`typeof window !== 'undefined'`, 'true'],
	['window', 'globalThis'],
	['const doc = get_root_for_style(node)', 'const doc = document'],
	[/get_root_for_style\(node\),/g, 'document,'],
].map(([find, replace]) => modify({ find, replace }))*/

export default async function () {
	const [
		svelte,
		sveltePreprocess,
		typescript,
		size,
		resolve,
		commonjs,
		terser,
		modify,
		path,
	] = await Promise.all([
		import('rollup-plugin-svelte').then((m) => m.default),
		import('svelte-preprocess').then((m) => m.default),
		import('@rollup/plugin-typescript').then((m) => m.default),
		import('rollup-plugin-size').then((m) => m.default),
		import('@rollup/plugin-node-resolve').then((m) => m.default),
		import('@rollup/plugin-commonjs').then((m) => m.default),
		import('@rollup/plugin-terser').then((m) => m.default),
		import('rollup-plugin-modify').then((m) => m.default),
		import('path').then((m) => m.default),
	])

	return {
		input: 'src/demo/demo.js',
		output: {
			name: 'app',
			format: 'iife',
			file: 'public/demo.js',
			sourcemap: true,
		},
		plugins: [
			commonjs(),
			svelte({
				preprocess: [
					sveltePreprocess({
						typescript: true, // Enable TypeScript in .svelte files
					}),
					cleanSvelteWhitespace,
				],
				typescript: true,
				compilerOptions: {
					dev: !production,
					immutable: true,
					css: false,
				},
			}),
			typescript({
				tsconfig: path.resolve(__dirname, 'tsconfig.json'), // Optional: reference tsconfig if needed
			}),
			resolve({ browser: true }),
			/*...findReplaceOptions,*/
			production && terser(terserOptions),
		],
	}
}
