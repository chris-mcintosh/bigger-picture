import BiggerPicture from './bigger-picture.svelte'
import { mount } from "svelte";

/**
 * Initializes BiggerPicture
 * @param {{target: HTMLElement | null}} options
 * @returns BiggerPicture instance
 */
export default function (options) {
	return mount(BiggerPicture, {
    		...options,
    		props: options,
    	})
}
