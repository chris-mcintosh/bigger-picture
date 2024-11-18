import BiggerPicture from './bigger-picture.svelte'

/**
 * Initializes BiggerPicture
 * @param {{target: HTMLElement | null}} options
 * @returns BiggerPicture instance
 */
export default function (options) {
	return new BiggerPicture({
		...options,
		props: options,
	})
}
