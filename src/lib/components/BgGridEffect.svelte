<script lang="ts">
	import { onMount } from 'svelte';

	$: mouseX = 0;
	$: mouseY = 0;
	onMount(() => {
		window.addEventListener('mousemove', (e) => {
			mouseX = e.clientX;
			mouseY = e.clientY;
		});
	});
</script>

<div
	class="bg-effect absolute top-0 z-10 hidden min-h-screen w-screen md:block"
	style="--mouse-x: {mouseX}px; --mouse-y: {mouseY}px;"
></div>

<style>
	.bg-effect {
		pointer-events: none;
		background: repeating-linear-gradient(
				0deg,
				transparent,
				transparent 19px,
				rgba(0, 0, 0, 0.1) 20px
			),
			repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0, 0, 0, 0.1) 20px);
		mask: radial-gradient(
			circle 300px at var(--mouse-x) var(--mouse-y),
			black 100%,
			transparent 100%
		);
	}
</style>
