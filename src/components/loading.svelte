<script lang="ts">
	import { fly } from 'svelte/transition'
	import { closing, getThumbBackground } from '../stores'

	let { activeItem, loaded } = $props();
</script>

{#if !loaded}
	<div
		class="bp-load"
		out:fly={{ duration: 480 }}
		style:background-image={getThumbBackground(activeItem)}
	>
		<span class="bp-bar"></span>
		<span class="bp-o"></span>
	</div>
{/if}

{#if $closing}
	<div
		class="bp-load"
		in:fly|global={{ duration: 480 }}
		style:background-image={getThumbBackground(activeItem)}
	></div>
{/if}
