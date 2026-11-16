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
- Use native Bun tools locally: `bun lint`, `bun fmt`, `bun check`, and `bun test`.
- `bun run format` and `bun run format:check` use Bun's formatter. It reads `.prettierrc` and `.prettierignore`, formats supported files natively, and delegates only `.astro` files to the installed Prettier/Astro plugin. Keep those dependencies for that fallback; do not invoke Prettier directly.
- During iteration, format/check only changed files: `bun fmt --check <files>` and `bun check <typescript-files>`. Native `bun check` does not replace Astro template checking.
- `bun run typecheck` runs Astro's checker, which also checks the project's TypeScript files. Use it for Astro template or interface changes and full validation, rather than every content or style adjustment.
- `bun run validate` performs full local validation before deployment. There is deliberately no `check` script, so `bun check` invokes the native type checker. Native lint requires canary; CI uses stable Bun for type-checking, building, and testing.
- Force manuscript regeneration with `bun scripts/render-papers.ts --force`.
- Match browser verification to the change. Do not repeat equation audits for unrelated UI edits or accumulate diagnostic scripts and screenshots in the workspace; use temporary files and remove them when finished.

## Markdown

- `custom/markdown/chiri.ts` supplies native Sätteri plugins for Chiri's markup and metadata. It reuses the exported media renderers in `src/plugins/remark-embedded-media.mjs`; the other original remark/rehype plugins remain as upstream reference code.
- Optional plugin dependencies load through `createRequire`: config-loaded plugin closures outlive Vite's config module runner, so ordinary dynamic imports can fail during a build.
- The Astro Vite environment externalizes the published `astro` package to reduce content-config loading overhead. Keep this scoped to that environment; collection references and image schemas must continue to work.
- `tests/markdown.test.js` exercises Markdown/MDX compatibility without building or launching a browser.

## Navigation

- Shared `BaseLayout` uses native document navigation and the shared `styles/transitions.css`; do not add `ClientRouter` or per-link `data-astro-reload` workarounds.
- `custom/navigation/Navigation.astro` emits `astro:page-load` once after each document's deferred scripts load, preserving Chiri widget initialization. The browser handles document and history lifecycle normally.
- The same shared component classifies initial entry/reload versus internal/history arrival before paint. Index entrance animations run only for initial entry and reload; the title explicitly reloads the index.
- Astro prepares internal destinations on hover. Use `data-prefetch-idle` on a high-value link to prepare it after any `[data-page-entrance]` animations finish and the browser becomes idle; `Publication` exposes this as its optional `prefetch` prop. Keep destination paths in content, not in navigation code.
- External and PDF links opt out of prefetching through `custom/links.ts`. Browser prerendering is an enhancement; data-saving settings and unsupported browsers must retain ordinary navigation.
