import { test, expect } from 'bun:test'
import { chiri } from '../custom/markdown/chiri'
import { mdxToJs } from 'satteri'
import { parse } from 'node-html-parser'

const renderer = await chiri().createRenderer({ syntaxHighlight: false })

test('Chiri headings, duplicate IDs and reading metadata', async () => {
  const result = await renderer.render('# Title\n\n## Hello, *world*!\n\n## Hello, *world*!\n\n#### Omitted')
  expect(result.metadata.frontmatter.toc).toEqual([
    { level: 2, text: 'Hello, world!', id: 'hello-world', index: 1 },
    { level: 2, text: 'Hello, world!', id: 'hello-world-1', index: 2 }
  ])
  expect(result.code).toContain('id="hello-world-1"')
  expect(result.metadata.frontmatter.minutesRead).toBe('1min')
  expect(result.metadata.frontmatter.readingTime.words).toBeGreaterThan(0)
})

test('inline and display math render KaTeX with accessible MathML', async () => {
  const result = await renderer.render('Inline $x^2$.\n\n$$\nx^2\n$$')
  const html = parse(result.code)
  expect(html.querySelectorAll('.katex').length).toBe(2)
  expect(html.querySelectorAll('.katex-display').length).toBe(1)
  expect(html.querySelectorAll('math').length).toBe(2)
  expect(html.querySelector('.katex-error')).toBeNull()
  expect(result.metadata.frontmatter.contentFeatures?.hasCodeBlock).toBeUndefined()
})

test('images retain captions, priority and viewer attributes', async () => {
  const result = await renderer.render(
    '![A caption](https://example.com/a.png)\n\n![no_caption](https://example.com/b.png)\n\nText ![Inline](https://example.com/c.png).'
  )
  const html = parse(result.code)
  expect(html.querySelectorAll('figure.image-caption-wrapper').length).toBe(1)
  expect(html.querySelector('figcaption')?.text).toBe('A caption')
  expect(html.querySelectorAll('img[data-preview="true"][loading="lazy"]').length).toBe(3)
  expect(html.querySelectorAll('img[fetchpriority="high"]').length).toBe(1)
  expect(html.querySelectorAll('img.img-placeholder').length).toBe(3)
  expect(result.metadata.frontmatter.contentFeatures.hasContentImage).toBe(true)
})

test('code, task lists and footnotes retain Chiri markup and feature flags', async () => {
  const result = await renderer.render('```js\nlet x = 1\n```\n\n- [x] Checked\n\nA note[^a].\n\n[^a]: Footnote.')
  const html = parse(result.code)
  expect(html.querySelector('.copy-code-wrapper > button.copy-button')?.getAttribute('aria-label')).toBe(
    'Copy code to clipboard'
  )
  expect(html.querySelector('.copy-code-wrapper > pre.copy-code-block')?.text).toContain('let x = 1')
  expect(result.metadata.frontmatter.contentFeatures).toMatchObject({ hasCodeBlock: true, hasFootnotes: true })
  const item = html.querySelector('.task-list-item')
  expect(item.innerHTML).toMatch(/<input[^>]*>Checked/)
})

test('existing directive renderers work for Markdown and MDX', async () => {
  const source = [
    '::github{repo="the3ash/astro-chiri"}',
    '::youtube{id="dQw4w9WgXcQ"}',
    '::spotify{url="https://open.spotify.com/track/123456"}',
    '::bilibili{id="BV1xx411c7mD"}',
    '::link{url="https://example.com/"}',
    '::x{url="https://x.com/example/status/123456789"}',
    '::neodb{url="https://neodb.social/book/example"}'
  ].join('\n\n')
  const result = await renderer.render(source)
  expect(result.code).toContain('class="gc-container"')
  expect(result.metadata.frontmatter.contentFeatures.hasGithubCard).toBe(true)
  expect(parse(result.code).querySelectorAll('iframe')).toHaveLength(3)
  expect(result.metadata.frontmatter.contentFeatures.hasCodeBlock).toBeUndefined()
  expect(result.metadata.frontmatter.contentFeatures).toMatchObject({
    hasLinkCard: true,
    hasXPost: true,
    hasNeoDBCard: true
  })
  const processor = chiri()
  const mdx = await mdxToJs('export const value = 1\n\n## Heading\n\n' + source + '\n\nInline $x^2$.', {
    ...processor.options,
    data: { astro: { frontmatter: {}, headings: [], localImagePaths: new Set(), remoteImagePaths: new Set() } }
  })
  expect(mdx.code).toContain('gc-container')
  expect(mdx.code).toContain('katex')
  expect(mdx.data.astro.frontmatter.contentFeatures.hasGithubCard).toBe(true)
  expect(mdx.data.astro.frontmatter.toc).toHaveLength(1)
})

test('MDX preserves Chiri image and code treatment', async () => {
  const processor = chiri()
  const result = await mdxToJs(
    '## Heading\n\n![Caption](https://example.com/a.png)\n\n```js\nlet x = 1\n```\n\nA note[^a].\n\n[^a]: Footnote.',
    {
      ...processor.options,
      data: { astro: { frontmatter: {}, headings: [], localImagePaths: new Set(), remoteImagePaths: new Set() } }
    }
  )
  expect(result.code).toContain('image-caption-wrapper')
  expect(result.code).toContain('copy-code-wrapper')
  expect(result.data.astro.frontmatter.contentFeatures).toMatchObject({
    hasContentImage: true,
    hasCodeBlock: true,
    hasFootnotes: true
  })
})

test('syntax highlighting retains the code-copy wrapper', async () => {
  const highlighted = await chiri().createRenderer({ shikiConfig: { theme: 'css-variables' } })
  const result = await highlighted.render('```js\nconst answer = 42\n```')
  const html = parse(result.code)
  expect(html.querySelectorAll('.copy-code-wrapper')).toHaveLength(1)
  expect(html.querySelector('pre')?.classList.contains('astro-code')).toBe(true)
  expect(html.querySelector('pre')?.innerHTML).toContain('class="line"')
})
