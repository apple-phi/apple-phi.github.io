import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'node-html-parser'
import katex from 'katex'
import type { Paper } from '../custom/manuscript/papers'

const root = fileURLToPath(new URL('../', import.meta.url))
const render = spawnSync(
  process.platform === 'win32' ? 'uvx.exe' : 'uvx',
  ['--from', 'quarto-cli==1.11.9', 'quarto', 'render', '--no-execute'],
  { cwd: root, stdio: 'inherit' }
)
if (render.error) throw render.error
if (render.status !== 0) process.exit(render.status ?? 1)

const papers: Paper[] = []
for (const entry of readdirSync(join(root, 'papers'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const document = parse(readFileSync(join(root, 'build/quarto/papers', entry.name, 'index.html'), 'utf8'))
  const body = document.querySelector('body')!
  const header = body.querySelector('#title-block-header')!
  const title = body.querySelector('.manuscript-title')?.textContent.trim()
  if (!title || !header) throw new Error(`Missing Quarto title block: ${entry.name}`)
  if (body.querySelector('script, link[rel="stylesheet"]')) {
    throw new Error(`Unexpected document dependencies inside the manuscript: ${entry.name}`)
  }

  // Quarto owns the text, numbering, citations, and anchors. Only adjust heading
  // hierarchy under the paper title; retain its IDs for Chiri's contents widget.
  const toc: Paper['toc'] = []
  for (const heading of body.querySelectorAll('h1, h2, h3, h4, h5')) {
    if (heading.closest('#title-block-header, .manuscript-abstract')) continue
    const level = Number(heading.tagName.slice(1))
    heading.tagName = `h${level + 1}`
    // Main sections keep a long paper's margin navigation within the viewport.
    if (level === 1 && heading.id) {
      toc.push({ id: heading.id, text: heading.textContent.trim(), level, index: toc.length })
    }
  }
  // Pandoc can put display math either alone or within a prose paragraph.
  // Split those paragraphs into real block siblings, preserving anchor wrappers
  // and inline markup, so all displays share normal collapsing block margins.
  const textBeforeBlocks = body.text.replace(/\s/g, '')
  for (const paragraph of body.querySelectorAll('p')) {
    if (!paragraph.querySelector('.math.display')) continue
    const blocks: string[] = []
    let prose = ''
    const flushProse = () => {
      if (prose.trim()) blocks.push(`<p>${prose}</p>`)
      prose = ''
    }
    for (const node of paragraph.childNodes) {
      const element = node.nodeType === 1 ? (node as typeof paragraph) : undefined
      if (
        (element?.classList.contains('display') && element.classList.contains('math')) ||
        element?.querySelector('.math.display')
      ) {
        flushProse()
        if (element?.tagName === 'SPAN' && !element.classList.contains('math')) element.tagName = 'div'
        blocks.push(`<div class="equation-block">${node.toString()}</div>`)
      } else {
        prose += node.toString()
      }
    }
    flushProse()
    paragraph.tagName = 'div'
    paragraph.set_content(blocks.join(''))
  }
  if (body.text.replace(/\s/g, '') !== textBeforeBlocks) {
    throw new Error(`Equation block normalization changed manuscript text: ${entry.name}`)
  }
  // Use the same installed KaTeX renderer and CSS as Chiri's Markdown pipeline.
  // Quarto has already resolved equation tags and all scholarly references.
  for (const math of body.querySelectorAll('.math')) {
    const tex = math.text
      .trim()
      .replace(/^\\[([]/, '')
      .replace(/\\[)\]]$/, '')
    math.set_content(
      katex.renderToString(tex, {
        displayMode: math.classList.contains('display'),
        output: 'htmlAndMathml',
        throwOnError: true,
        strict: 'error'
      })
    )
    if (math.classList.contains('display')) {
      // Keep KaTeX's accessible MathML intact. Group only its visual formula
      // into a grid cell so the equation number takes up real layout space.
      const visual = math.querySelector('.katex-html')!
      const tag = visual.querySelector('.katex-tag')
      if (tag && tag.parentNode !== visual) {
        throw new Error(`Unexpected nested equation number: ${entry.name}`)
      }
      const formula = visual.childNodes
        .filter((node) => node !== tag)
        .map((node) => node.toString())
        .join('')
      tag?.classList.add('equation-number')
      visual.set_content(`<span class="equation-formula">${formula}</span>${tag?.outerHTML ?? ''}`)
      visual.classList.add('equation-row')
    }
  }
  const field = (name: string) => {
    const value = header.getAttribute(`data-${name}`)
    if (!value) throw new Error(`Missing publication metadata ${name}: ${entry.name}`)
    header.removeAttribute(`data-${name}`)
    return value
  }
  const key = field('citation-key')
  const venue = field('citation-venue')
  const year = field('citation-year')
  const url = field('citation-url')
  const arxiv = field('arxiv-url')
  const affiliationName = header.getAttribute('data-affiliation-name')
  const affiliationUrl = header.getAttribute('data-affiliation-url')
  if (affiliationName && affiliationUrl) {
    const affiliation = header
      .querySelectorAll('.manuscript-affiliation-name')
      .find((name) => name.text === affiliationName)
    if (!affiliation) throw new Error(`Unknown linked affiliation: ${affiliationName}`)
    affiliation.tagName = 'a'
    affiliation.setAttribute('href', affiliationUrl)
    header.removeAttribute('data-affiliation-name')
    header.removeAttribute('data-affiliation-url')
  }
  const authors = document.querySelectorAll('meta[name="author"]').map((author) => author.getAttribute('content')!)
  if (!authors.length || !/^[\w-]+$/.test(key) || !/^\d{4}$/.test(year)) {
    throw new Error(`Invalid publication metadata: ${entry.name}`)
  }
  const escapeBibtex = (value: string) => value.replace(/[\\{}%&#_$]/g, '\\$&')
  const bibtex = `@inproceedings{\n${key},\ntitle={${escapeBibtex(title)}},\nauthor={${authors.map(escapeBibtex).join(' and ')}},\nbooktitle={${escapeBibtex(venue)}},\nyear={${year}},\nurl={${url}}\n}`
  // Give wide tables a scroll container without making their captions scroll.
  for (const table of body.querySelectorAll('table')) {
    table.replaceWith(
      `<div class="manuscript-table" tabindex="0" role="region" aria-label="Scrollable table">${table.outerHTML}</div>`
    )
  }
  for (const title of body.querySelectorAll('.theorem-title')) {
    const label = title.querySelector('strong') ?? title
    if (!/[.!?]$/.test(label.text.trim())) label.appendChild(parse('.').childNodes[0])
  }
  // Match the paper's appendix TOC: only A–F, immediately after "Appendix"
  // and before the organization paragraph. Keep Quarto's resolved anchors.
  const appendixHeadings = body
    .querySelectorAll('h2[data-paper-number]')
    .filter((heading) => /^[A-Z]$/.test(heading.getAttribute('data-paper-number')!))
  if (appendixHeadings.length) {
    const links = appendixHeadings
      .map((heading) => `<li><a href="#${heading.id}">${heading.innerHTML}</a></li>`)
      .join('')
    const appendixTitle = body.querySelector('#appendix')
    if (!appendixTitle) throw new Error(`Missing appendix heading: ${entry.name}`)
    appendixTitle.insertAdjacentHTML(
      'afterend',
      `<nav class="appendix-contents" aria-label="Appendix contents"><ol>${links}</ol></nav>`
    )
  }
  const ids = new Set(body.querySelectorAll('[id]').map((element) => element.id))
  for (const link of body.querySelectorAll('a[href^="#"]')) {
    const target = decodeURIComponent(link.getAttribute('href')!.slice(1))
    if (target && !ids.has(target)) throw new Error(`Broken manuscript reference: ${entry.name} #${target}`)
  }
  const titleBlock = header.outerHTML
  header.remove()
  papers.push({
    slug: entry.name,
    title,
    description: body.querySelector('.manuscript-abstract > div')?.textContent.trim() ?? title,
    html: body.innerHTML,
    header: titleBlock,
    bibtex,
    arxiv,
    toc
  })
}
mkdirSync(join(root, 'build'), { recursive: true })
writeFileSync(join(root, 'build/papers.json'), JSON.stringify(papers))
process.stdout.write(`Prepared ${papers.length} Quarto manuscript(s) for Astro.\n`)
