<script lang="ts">
	import { onMount } from 'svelte';
	let extraClasses = '';
	export { extraClasses as class };

	$: mouseX = undefined as number | undefined;
	$: mouseY = undefined as number | undefined;
	onMount(() => {
		window.addEventListener('mousemove', (e) => {
			mouseX = e.clientX;
			mouseY = e.clientY;
		});
	});
</script>

<div class="bg-effect {extraClasses}" style="--mouse-x: {mouseX}px; --mouse-y: {mouseY}px;">
	<slot></slot>
</div>

<style>
	.bg-effect {
		/* @apply bg-slate-50; */
		position: relative;
		background: repeating-linear-gradient(
				0deg,
				transparent,
				transparent 19px,
				rgba(0, 0, 0, 0.1) 20px
			),
			repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0, 0, 0, 0.1) 20px);
		background-size: cover;
	}
	.bg-effect::before {
		/* mask: radial-gradient(
			circle 300px at var(--mouse-x) var(--mouse-y),
			black 100%,
			transparent 100%
		); */
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 100px; /* Diameter of the circle */
		height: 100px; /* Diameter of the circle */
		background: rgba(255, 255, 255, 1);
		pointer-events: none;
		transform: translate(-50%, -50%);
		clip-path: circle(50%);
	}
</style>
