import sveltePreprocess from 'svelte-preprocess'

export default {
	preprocess: sveltePreprocess({
		typescript: {
			transpileOnly: true, // Optional: You can set this to `true` to speed up the compilation but lose type checking
		},
	}),
	// Other options here
}
