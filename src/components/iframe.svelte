<script lang="ts">
	import { addAttributes } from '../stores'
	//@ts-ignore
	import Loading from './loading.svelte'

	let { allProps } = $props()

	let loaded: boolean = $state(false)
	let dimensions: any[] = $state([])

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
		onload={() => (loaded = true)}
	></iframe>
	<Loading {activeItem} {loaded} />
</div>
