import type { PreprocessorGroup } from 'svelte/compiler';

function modifyCode(code: string) {
	// Make the regex for removing the "lang" attribute more robust to handle variations in formatting
	let modifiedCode = code.replace(/<script\s+lang=["']paperscript["']/i, '<script');

	// Replace the script tag with a new one that uses Paper.js
	modifiedCode = modifiedCode.replace(/<script[^>]*>([\s\S]*?)<\/script>/i, (_, scriptContents) => {
		return `<script>
import paper from 'paper';
import { onMount } from 'svelte';
let __canvas;
onMount(() => {
    let s = new paper.PaperScope();
    s.setup(__canvas);
    s.paper.execute(\`${scriptContents}\`)
});
</script>`;
	});

	// Add a bind:this directive to the canvas element
	modifiedCode = modifiedCode.replace(/<canvas\s*(.*?)>/i, (_, existingAttrs) => {
		return `<canvas ${existingAttrs} bind:this={__canvas}>`;
	});
	return modifiedCode;
}

export const paperscriptPreprocessor: PreprocessorGroup = {
	name: 'paperscript',
	markup: ({ content }) => {
		if (content.trim().match(/<script\s+lang=["']paperscript["']/i)) {
			return { code: modifyCode(content) };
		}
	}
};
