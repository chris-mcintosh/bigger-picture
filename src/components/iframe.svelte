<!-- @migration-task Error while migrating Svelte code: migrating this component would require adding a `$props` rune but there's already a variable named props.
     Rename the variable and try again or migrate by hand. -->
<script>
	import { addAttributes } from '../stores'
	import Loading from './loading.svelte'

	export let props

	let loaded, dimensions

	const { activeItem } = props

	const setDimensions = () =>
		(dimensions = props.calculateDimensions(activeItem))

	setDimensions()

	props.setResizeFunc(setDimensions)

	const addSrc = (node) => {
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
	<!-- svelte-ignore element_invalid_self_closing_tag -->
	<iframe
		use:addSrc
		allow="autoplay; fullscreen"
		title={activeItem.title}
		on:load={() => (loaded = true)}
	/>
	<Loading {activeItem} {loaded} />
</div>
