<script>
	let { bp } = $props();
</script>

<div class="dialog">
	<span></span>
	<h2>Use location services?</h2>
	<p>
		In order to give directional instructions, we kindly ask you to turn on the
		location services.
	</p>
	<div>
		<button onclick={bp.close}>Close</button>
		<button onclick={bp.close} class="cta">Confirm</button>
	</div>
</div>
