<script lang="ts">
	import { run } from 'svelte/legacy'

	import { fly } from 'svelte/transition'
	import { cubicOut } from 'svelte/easing'
	import ImageItem from './components/image.svelte'
	import Iframe from './components/iframe.svelte'
	import Video from './components/video.svelte'
	import { writable } from 'svelte/store'
	import { closing } from './stores'

	interface Props {
		/** items currently displayed in gallery */
		items?: any[] | undefined | null
		/** element the gallery is mounted within (passed during initialization)*/
		target?: any | undefined
	}

	let { items = $bindable(undefined), target = undefined }: Props = $props()

	const html = document.documentElement

	/** index of current active item */
	let position: number = $state(0)

	/** options passed via open method */
	let opts:
		| {
				onUpdate?: Function
				inline?: any
				position?: any
				items?: any
				el?: any
				onClose?: Function
				noClose?: Function
				sizes?: any
				intro?: any
				onOpen?: Function
				onResize?: Function
				onClosed?: Function
				focusWrap?: any
				scale?: number
		  }
		| undefined = $state()

	/** bool tracks open state */
	let isOpen: boolean = $state(false)

	/** dom element to restore focus to on close */
	let focusTrigger: Element | null | any

	/** bool true if container width < 769 */
	let smallScreen: boolean = $state(false)

	/** bool value of inline option passed in open method */
	let inline: any = $state()

	/** when position is set */
	let movement: number

	/** stores target on pointerdown (ref for overlay close) */
	let clickedEl: EventTarget | null = $state(null)

	/** active item object */
	let activeItem:
		| {
				[x: string]: any
				img?: any
				sources?: any
				iframe?: any
				element?: any
				i?: any
				html?: any
				caption?: any
				width?: number
				height?: number
		  }
		| undefined = $state()

	/** returns true if `activeItem` is html */
	const activeItemIsHtml = () =>
		!activeItem?.img && !activeItem?.sources && !activeItem?.iframe

	/** function set by child component to run when container resized */
	let resizeFunc: () => void
	/** used by child components to set resize function */
	const setResizeFunc = (fn: any) => (resizeFunc = fn)

	/** container element (el) / width (w) / height (h) */
	const container: any = $state({})

	// /** true if image is currently zoomed past starting size */
	const zoomed = writable(0)

	run(() => {
		if (items) {
			// update active item when position changes
			activeItem = items[position]
			if (isOpen) {
				// run onUpdate when items updated
				opts?.onUpdate?.(container.el, activeItem)
			}
		}
	})

	/** receives options and opens gallery */
	export const open = (options: any) => {
		opts = options
		inline = opts?.inline
		// add class to hide scroll if not inline gallery
		if (!inline && html.scrollHeight > html.clientHeight) {
			html.classList.add('bp-lock')
		}
		// update trigger element to restore focus
		focusTrigger = document.activeElement
		container.w = target.offsetWidth
		container.h =
			target === document.body ? window.innerHeight : target.clientHeight
		smallScreen = container.w < 769
		position = opts?.position || 0
		// set items
		items = []
		for (let i = 0; i < (opts?.items.length || 1); i++) {
			let item = opts?.items[i] || opts?.items
			if ('dataset' in item) {
				items.push({ element: item, i, ...item.dataset })
			} else {
				item.i = i
				items.push(item)
				// set item to element for position check below
				item = item.element
			}
			// override gallery position if needed
			if (opts?.el && opts?.el === item) {
				position = i
			}
		}
	}

	/** closes gallery */
	export const close = () => {
		opts?.onClose?.(container.el, activeItem)
		closing.set(true)
		items = null
		// restore focus to trigger element
		focusTrigger?.focus({ preventScroll: true })
	}

	/** previous gallery item */
	export const prev = () => setPosition(position - 1)

	/** next gallery item */
	export const next = () => setPosition(position + 1)

	/**
	 * go to specific item in gallery
	 * @param {number} index
	 */
	export const setPosition = (index: number) => {
		movement = index - position
		position = getNextPosition(index)
	}

	/**
	 * returns next gallery position (looped if neccessary)
	 * @param {number} index
	 */
	const getNextPosition = (index: number) => {
		if (items) return (index + items.length) % items.length
		else return index + 1
	}

	const onKeydown = (e: {
		preventDefault?: any
		key?: any
		shiftKey?: any
	}) => {
		const { key, shiftKey } = e
		if (key === 'Escape') {
			!opts?.noClose && close()
		} else if (key === 'ArrowRight') {
			next()
		} else if (key === 'ArrowLeft') {
			prev()
		} else if (key === 'Tab') {
			// trap focus on tab press
			const { activeElement } = document
			// allow browser to handle tab into video controls only
			//@ts-ignore
			if (shiftKey || !(activeElement && activeElement.controls)) {
				e.preventDefault()
				//@ts-ignore
				const { focusWrap = container.el } = opts
				const tabbable = [...focusWrap.querySelectorAll('*')].filter(
					(node) => node.tabIndex >= 0
				)
				let index = tabbable.indexOf(activeElement)
				index += tabbable.length + (shiftKey ? -1 : 1)
				tabbable[index % tabbable.length].focus()
			}
		}
	}

	/**
	 * calculate dimensions of height / width resized to fit within container
	 * @param {object} item object with height / width properties
	 * @returns {Array} [width: number, height: number]
	 */
	//@ts-ignore
	const calculateDimensions = ({ width, height }) => {
		//chris may need to default 1920 x 1080
		//@ts-ignore
		const { scale = 0.99 } = opts
		const ratio = Math.min(
			1,
			(container.w / width) * scale,
			(container.h / height) * scale
		)
		// round number so we don't use a float as the sizes attribute
		return [Math.round(width * ratio), Math.round(height * ratio)]
	}

	/** preloads images for previous and next items in gallery */
	const preloadNext = () => {
		if (items) {
			const nextItem = items[getNextPosition(position + 1)]
			const prevItem = items[getNextPosition(position - 1)]
			!nextItem.preload && loadImage(nextItem)
			!prevItem.preload && loadImage(prevItem)
		}
	}

	/** loads / decodes image for item */
	const loadImage = (item: {
		img?: any
		preload?: any
		width?: any
		height?: any
	}) => {
		if (item.img) {
			const image = document.createElement('img')
			//@ts-ignore
			image.sizes = opts?.sizes || `${calculateDimensions(item)[0]}px`
			image.srcset = item.img
			item.preload = true
			return image.decode().catch((error) => {})
		}
	}

	/** svelte transition to control opening / changing */
	const mediaTransition = (node: Element, isEntering: boolean) => {
		if (!isOpen || !items) {
			// entrance / exit transition
			isOpen = isEntering
			return opts?.intro
				? fly(node, { y: isEntering ? 10 : -10 })
				: scaleIn(node)
		}
		// forward / backward transition
		return fly(node, {
			x: (movement > 0 ? 20 : -20) * (isEntering ? 1 : -1),
			duration: 250,
		})
	}

	/** custom svelte transition for entrance zoom */
	const scaleIn = (node: Element) => {
		let dimensions

		if (activeItemIsHtml()) {
			const bpItem = node?.firstChild?.firstChild
			//@ts-ignore
			dimensions = [bpItem?.clientWidth, bpItem?.clientHeight]
		} else {
			//@ts-ignore
			dimensions = calculateDimensions(activeItem)
		}

		// rect is bounding rect of trigger element
		const rect = (activeItem?.element || focusTrigger).getBoundingClientRect()
		const leftOffset = rect.left - (container.w - rect.width) / 2
		const centerTop = rect.top - (container.h - rect.height) / 2
		const scaleWidth = rect.width / dimensions[0]
		const scaleHeight = rect.height / dimensions[1]

		return {
			duration: 480,
			easing: cubicOut,
			css: (t: number, u: number) => {
				return `transform:translate3d(${leftOffset * u}px, ${
					centerTop * u
				}px, 0) scale3d(${scaleWidth + t * (1 - scaleWidth)}, ${
					scaleHeight + t * (1 - scaleHeight)
				}, 1)`
			},
		}
	}

	/** provides object w/ needed funcs / data to child components  */
	const getChildProps = () => ({
		activeItem,
		calculateDimensions,
		loadImage,
		preloadNext,
		opts,
		prev,
		next,
		close,
		setResizeFunc,
		zoomed,
		container,
	})

	/** code to run on mount / destroy */
	const containerActions = (node: Element) => {
		container.el = node
		let roActive: boolean
		opts?.onOpen?.(container.el, activeItem)
		// don't use keyboard events for inline galleries
		if (!inline) {
			window.addEventListener('keydown', onKeydown)
		}
		// set up resize observer
		const ro = new ResizeObserver((entries) => {
			// use roActive to avoid running on initial open
			if (roActive) {
				container.w = entries[0].contentRect.width
				container.h = entries[0].contentRect.height
				smallScreen = container.w < 769
				// run child component resize function
				if (!activeItemIsHtml()) {
					resizeFunc?.()
				}
				// run user defined onResize function
				opts?.onResize?.(container.el, activeItem)
			}
			roActive = true
		})
		ro.observe(node)
		return {
			destroy() {
				ro.disconnect()
				window.removeEventListener('keydown', onKeydown)
				closing.set(false)
				// remove class hiding scroll
				html.classList.remove('bp-lock')
				opts?.onClosed?.()
			},
		}
	}
	const forceDownload = (blobUrl: string, filename: string) => {
		let a = document.createElement('a')
		a.download = filename
		a.href = blobUrl
		document.body.appendChild(a)
		a.click()
		a.remove()
	}

	const downloadPhoto = (url: RequestInfo | URL, filename: any) => {
		//@ts-ignore
		if (!filename) filename = url.split('\\').pop().split('/').pop()
		fetch(url, {
			headers: new Headers({
				Origin: location.origin,
			}),
			mode: 'cors',
		})
			.then((response) => response.blob())
			.then((blob) => {
				let blobUrl = window.URL.createObjectURL(blob)
				forceDownload(blobUrl, filename)
			})
			.catch((e) => console.error(e))
	}

	export { items, target }
</script>

{#if items}
	<div
		use:containerActions
		class="bp-wrap"
		class:bp-zoomed={$zoomed}
		class:bp-inline={inline}
		class:bp-small={smallScreen}
		class:bp-noclose={opts?.noClose}
	>
		<div out:fly={{ duration: 480 }}></div>
		{#key activeItem?.i}
			<div
				class="bp-inner"
				in:mediaTransition|global={true}
				out:mediaTransition|global={false}
				onpointerdown={(e) => (clickedEl = e.target)}
				onpointerup={function (e) {
					// only close if left click on self and not dragged
					//@ts-ignore
					if (e.button !== 2 && e.target === this && clickedEl === this) {
						!opts?.noClose && close()
					}
				}}
			>
				{#if activeItem?.img}
					<ImageItem allProps={getChildProps()} {smallScreen} />
				{:else if activeItem?.sources}
					<Video allProps={getChildProps()} />
				{:else if activeItem?.iframe}
					<Iframe allProps={getChildProps()} />
				{:else}
					<div class="bp-html">
						{@html activeItem?.html ?? activeItem?.element.outerHTML}
					</div>
				{/if}
			</div>
			{#if activeItem?.caption}
				<div class="bp-cap" out:fly|global={{ duration: 200 }}>
					{@html activeItem.caption}
				</div>
			{/if}
		{/key}

		<div class="bp-controls" out:fly>
			<!-- Close button -->
			<button
				class="bp-base bp-x"
				title="Close"
				aria-label="Close"
				onclick={close}
			></button>
			<!-- External button -->
			<button
				class="bp-base bp-ext"
				title="Open Fullsize"
				aria-label="Open Fullsize"
				onclick={() => {
					//@ts-ignore
					const url = Object.hasOwn(activeItem, 'full')
						? activeItem?.['full']
						: activeItem?.['img']
					window.open(url, '_blank')
				}}
			></button>
			<!-- Save button -->
			<button
				class="bp-base bp-save"
				title="Save"
				aria-label="Save"
				onclick={() => {
					//@ts-ignore
					const url = Object.hasOwn(activeItem, 'full')
						? activeItem?.['full']
						: activeItem?.['img']
					downloadPhoto(url, url.replace(/.*\//, ''))
				}}
			></button>
			<!-- Save All -->
			<!-- Share All  -->

			{#if items.length > 1}
				<!-- counter -->
				<div class="bp-count">
					{@html `${position + 1} / ${items.length}`}
				</div>
				<!-- foward / back buttons -->
				<button
					class="bp-prev"
					title="Previous"
					aria-label="Previous"
					onclick={prev}
				></button>
				<button class="bp-next" title="Next" aria-label="Next" onclick={next}
				></button>
			{/if}
		</div>
	</div>
{/if}
