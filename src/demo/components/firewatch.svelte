<script>
	import { fade } from 'svelte/transition'

	/**
	 * @typedef {Object} Props
	 * @property {boolean} [isClosing]
	 */

	/** @type {Props} */
	let { isClosing = false } = $props()

	let layers = Array.from(Array(9))

	let y = $state()

	let onScroll = (e) => (y = e.target.scrollTop)

	export { isClosing }
</script>

<div class="firewatch">
	<div class="parallax-container">
		{#each layers as layer, i}
			<img
				style="transform: translate(0,{(-y * i) / (layers.length - 1)}px)"
				src="https://assets.henrygd.me/bp/images/firewatch/parallax{i}.png"
				alt="parallax layer {layer}"
				decoding="async"
			/>
		{/each}
	</div>

	<span style="opacity: {1 - Math.max(0, y / 50)}"> scroll down </span>

	<div class="firewatch-scroll" onscroll={onScroll}>
		<div class="foreground">
			You have scrolled {Math.round(y)} pixels
		</div>
	</div>

	{#if isClosing}
		<img
			in:fade|global
			src="https://assets.henrygd.me/bp/images/firewatch-2.png"
			decoding="async"
			alt=""
		/>
	{/if}
</div>
