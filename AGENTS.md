# Notes for agents

This is a personal site, based on Chiri,
after consolidating and deleting some non-core functionality.

Never:

- Edit `src/` without asking first.

Last synced on: `7th November 2026`

If the above date is >1M old:

- Compare `./src/` to `github.com/the3ash/astro-chiri/tree/main/src`.
- Propose which changes or Chiri commits you believe are worth adopting.
- Update the above date.

## Development and checks

- `bun run dev` and `bun run build` reuse prepared manuscripts when their inputs are unchanged.
- `bun test` validates existing build output; use `bun run build` first for fresh output. Tests do not launch renderers or browsers.
- `bun run typecheck` runs Astro's checker, which also checks the project's TypeScript files.
- `bun run check` performs full local validation. Native lint requires canary; CI uses stable Bun for type-checking, building, and testing.
- Force manuscript regeneration with `bun scripts/render-papers.ts --force`.
- Match browser verification to the change. Do not repeat equation audits for unrelated UI edits or accumulate diagnostic scripts and screenshots in the workspace; use temporary files and remove them when finished.

## Markdown

- `custom/markdown/chiri.ts` supplies native Sätteri plugins for Chiri's markup and metadata. It reuses the exported media renderers in `src/plugins/remark-embedded-media.mjs`; the other original remark/rehype plugins remain as upstream reference code.
- Optional plugin dependencies load through `createRequire`: config-loaded plugin closures outlive Vite's config module runner, so ordinary dynamic imports can fail during a build.
- The Astro Vite environment externalizes the published `astro` package to reduce content-config loading overhead. Keep this scoped to that environment; collection references and image schemas must continue to work.
- `tests/markdown.test.js` exercises Markdown/MDX compatibility without building or launching a browser.
