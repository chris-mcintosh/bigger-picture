<script>
	import { run } from 'svelte/legacy';

	import BiggerPicture from '../bigger-picture.js'
	import { tweened } from 'svelte/motion'
	import { fade } from 'svelte/transition'
	import { cubicOut } from 'svelte/easing'
	import { resize } from './actions'

	let opts = $state()

	let bp = $state()
	let bpItems = $state([])
	let position = $state()

	let thumbsWidth = $state()
	let containerWidth = $state()
	let initialTranslate = 0
	let isPointerDown, pointerDownPos, hasDragged = $state()
	let dragPositions = []
	let focusWrap = $state()
	let closing

	const prefersReducedMotion = globalThis.matchMedia?.(
		'(prefers-reduced-motion: reduce)'
	).matches

	let translate = tweened(0, {
		easing: cubicOut,
		duration: prefersReducedMotion ? 0 : 250,
	})


	export const open = (options) => {
		opts = closing ? null : options
	}

	function boundTranslate(int) {
		if (int >= 0) {
			int = 0
		} else if (int < containerWidth - thumbsWidth - 1) {
			int = containerWidth - thumbsWidth - 1
		}
		return int
	}

	// moves active thumb button into view
	function scrollToButton(button) {
		// set button to active
		let activeBtn = button || focusWrap.querySelector('.active')
		// move button into view if off screen (changing translate value)
		let { left, right, width } = activeBtn.getBoundingClientRect()
		let margin = 3
		let { offsetLeft } = activeBtn
		if (left + width > containerWidth) {
			$translate = boundTranslate(-offsetLeft - width + containerWidth - margin)
		} else if (right - width < 0) {
			$translate = boundTranslate(-offsetLeft + margin)
		}
	}

	function pointerDown(e) {
		if (thumbsWidth < containerWidth) {
			return
		}
		let { clientX } = e
		isPointerDown = true
		pointerDownPos = clientX
	}

	function pointerMove(e) {
		if (isPointerDown) {
			let { clientX } = e
			let dragAmount = -(pointerDownPos - clientX)
			if (hasDragged) {
				translate.set(boundTranslate(initialTranslate + dragAmount), {
					duration: 0,
				})
				dragPositions.push(clientX)
			} else {
				hasDragged = Math.abs(dragAmount) > 5
			}
		}
	}
	function pointerUp() {
		if (hasDragged) {
			// drag inertia
			dragPositions = dragPositions.slice(-3)
			let xDiff = dragPositions[1] - dragPositions[2]
			xDiff = dragPositions[0] - dragPositions[2]
			if (Math.abs(xDiff) > 5) {
				$translate = boundTranslate($translate - xDiff * 5)
			}
		}
		dragPositions = []
		isPointerDown = hasDragged = false
		initialTranslate = $translate
	}

	const onMount = (bpWrap) => {
		bp = BiggerPicture({
			target: bpWrap,
		})
		bp.open({
			...opts,
			focusWrap,
			onOpen: () => (bpItems = bp.items),
			onUpdate(container, activeItem) {
				position = activeItem.i
			},
			onClose() {
				closing = true
				opts = null
			},
			onClosed: () => (closing = false),
		})
	}
	run(() => {
		if (position !== undefined) {
			// make sure button is in view when position updates
			setTimeout(scrollToButton, 0)
		}
	});
</script>

{#if opts}
	<div
		class="thumbnail-wrap"
		bind:this={focusWrap}
		onpointermove={pointerMove}
		onpointerup={pointerUp}
		onpointercancel={pointerUp}
		use:resize
		onbp:resize={({ detail }) => {
			containerWidth = detail.cr.width
			$translate = 0
		}}
	>
		<div class="thumbnail-bp" use:onMount></div>
		<div
			class="thumbnails"
			in:fade|global={{
				easing: cubicOut,
				duration: prefersReducedMotion ? 0 : 480,
			}}
			out:fade|global={{
				easing: cubicOut,
				duration: prefersReducedMotion ? 0 : 480,
			}}
		>
			<div
				style="transform: translatex({$translate}px)"
				onpointerdown={pointerDown}
				use:resize
				onbp:resize={({ detail }) => {
					thumbsWidth = detail.cr.width
				}}
			>
				<div>
					{#each bpItems as element (element.i)}
						<button
							title={element.alt}
							aria-label={element.alt}
							style="background-image:url({element.thumb})"
							class:active={element.i === position}
							onfocus={(e) => scrollToButton(e.target)}
							onpointerup={() => !hasDragged && bp.setPosition(element.i)}
							onkeyup={(e) => e.key === 'Enter' && bp.setPosition(element.i)}
						></button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
