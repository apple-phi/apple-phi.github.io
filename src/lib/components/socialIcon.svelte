<script lang="ts">
	export let name: string;
	export let icon: string;
	export let href: string;

	import { Tooltip } from 'bits-ui';
	import { flyAndScale } from '$lib/shadcn-utils';
</script>

<Tooltip.Root openDelay={0} closeDelay={0}>
	<Tooltip.Trigger>
		<a {href} target="_blank" rel="noopener noreferrer">
			<img src={icon} class="inline-block h-6 w-6" alt="{name} icon" />
		</a>
	</Tooltip.Trigger>
	<Tooltip.Content
		transition={flyAndScale}
		transitionConfig={{ y: 8, duration: 150 }}
		sideOffset={4}
		side="bottom"
	>
		<div class="z-50 flex items-center justify-center p-3 font-sans text-sm font-medium">
			<a {href} target="_blank" rel="noopener noreferrer">
				{name}
			</a>
		</div>
	</Tooltip.Content>
</Tooltip.Root>
