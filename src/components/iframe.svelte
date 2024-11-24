<script lang="ts">
	import { addAttributes } from '../stores'
	//@ts-ignore
	import Loading from './loading.svelte'

	export let allProps

	let loaded: boolean
	let dimensions: any[]

	const { activeItem } = allProps

	const setDimensions = () =>
		(dimensions = allProps.calculateDimensions(activeItem))

	setDimensions()

	allProps.setResizeFunc(setDimensions)

	const addSrc = (node: any) => {
		addAttributes(node, activeItem.attr)
		node.src = activeItem.iframe
	}
</script>

<div
	class="bp-if"
	style="
		width:{dimensions[0]}px;
		height:{dimensions[1]}px
	"
>
	<iframe
		use:addSrc
		allow="autoplay; fullscreen"
		title={activeItem.title}
		on:load={() => (loaded = true)}
	/>
	<Loading {activeItem} {loaded} />
</div>
