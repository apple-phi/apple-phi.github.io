import { describe, test } from 'bun:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'node-html-parser'

// Artifact tests only: no rendering, subprocesses, browsers, or network access.
const root = fileURLToPath(new URL('../', import.meta.url))
const preparedPath = join(root, 'build/papers.json')
const buildFirst = 'Build output missing. Run "bun run build" before "bun test".'
assert(existsSync(preparedPath), buildFirst)

for (const paper of JSON.parse(readFileSync(preparedPath, 'utf8'))) {
  const originalPath = join(root, 'build/quarto/papers', paper.slug, 'index.html')
  const pagePath = join(root, 'dist/papers', paper.slug, 'index.html')
  assert(existsSync(originalPath) && existsSync(pagePath), buildFirst)
  const original = parse(readFileSync(originalPath, 'utf8'))
  const page = parse(readFileSync(pagePath, 'utf8'))
  const article = page.querySelector('article.manuscript')
  assert(article, `${paper.slug}: missing manuscript`)
  // Navigation labels repeat manuscript text; exclude them from fidelity checks.
  const content = parse(article.innerHTML)
  content.querySelector('.appendix-contents')?.remove()

  describe(paper.slug, () => {
    test('mathematics and equation numbering survive conversion', () => {
      assert.equal(content.querySelectorAll('.katex').length, original.querySelectorAll('body .math').length)
      assert.equal(content.querySelectorAll('.math').length, original.querySelectorAll('body .math').length)
      assert(!content.querySelector('.katex-error'), 'Invalid rendered math')
      const expectedNumbers = original
        .querySelectorAll('body .math.display')
        .map((math) => math.text.match(/\\tag\{([^}]+)\}/)?.[1])
        .filter(Boolean)
        .map((number) => `(${number})`)
      assert.deepEqual(
        content.querySelectorAll('.equation-number').map((number) => number.text.trim()),
        expectedNumbers
      )
      for (const math of content.querySelectorAll('.math.display')) {
        assert(!math.closest('p'), 'Display equation embedded in prose paragraph')
        assert(math.querySelector('.katex-mathml'), 'Display equation lost its MathML')
      }
      assert(!page.querySelector('script[src*="mathjax"], script[src*="katex"]'), 'Math must render at build time')
      let joinedPunctuation = 0
      const inlineMath = content.querySelectorAll('.math.inline')
      const originalInlineMath = original.querySelectorAll('body .math.inline')
      assert.equal(inlineMath.length, originalInlineMath.length)
      for (const [index, math] of inlineMath.entries()) {
        assert.equal(
          math.querySelector('annotation[encoding="application/x-tex"]')?.text,
          originalInlineMath[index].text
            .trim()
            .replace(/^\\[([]/, '')
            .replace(/\\[)\]]$/, ''),
          'Inline-math punctuation handling changed the accessible formula source'
        )
        const siblings = math.parentNode.childNodes
        const next = siblings[siblings.indexOf(math) + 1]
        if (next?.nodeType !== 3) continue
        assert(!/^[,.;:!?%…)\]}’”]/u.test(next.rawText), 'Punctuation can break away from inline math')
        const tail = math.querySelector('.math-tail')
        if (tail) {
          joinedPunctuation++
          assert(tail.querySelector('.katex-html[aria-hidden="true"] .katex-base'))
          assert(tail.querySelector('.math-punctuation'))
          assert(!tail.hasAttribute('aria-hidden'), 'Punctuation must remain accessible')
        }
      }
      assert(joinedPunctuation > 0, 'No inline-math punctuation was protected')
    })

    test('citations, bibliography, and publication metadata survive conversion', () => {
      for (const selector of ['.citation', '.csl-entry', '.footnote-ref', '.footnote-back']) {
        assert.equal(
          content.querySelectorAll(selector).length,
          original.querySelectorAll(`body ${selector}`).length,
          `Lost ${selector}`
        )
      }
      for (const citation of content.querySelectorAll('.citation')) {
        assert(citation.querySelector('a[href^="#ref-"]'), `Unlinked citation: ${citation.text}`)
      }
      assert.equal(page.querySelector('.manuscript-actions > a')?.getAttribute('href'), paper.arxiv)
      const citation = page.querySelector('.citation-content pre')
      assert(citation, 'Missing BibTeX entry')
      // node-html-parser treats <pre> as raw text, unlike the browser DOM.
      assert.equal(parse(citation.innerHTML).querySelector('code')?.text, paper.bibtex)
      const affiliationUrl = original.querySelector('#title-block-header')?.getAttribute('data-affiliation-url')
      if (affiliationUrl)
        assert.equal(article.querySelector('a.manuscript-affiliation-name')?.getAttribute('href'), affiliationUrl)
    })

    test('section numbering, anchors, and internal links remain valid', () => {
      const anchored = article.querySelectorAll('[id]')
      const ids = new Set(anchored.map((element) => element.id))
      assert.equal(ids.size, anchored.length, 'Duplicate article anchors')
      for (const element of original.querySelectorAll('body [id]'))
        assert(ids.has(element.id), `Lost anchor: ${element.id}`)
      for (const link of page.querySelectorAll('a[href^="#"]')) {
        const target = decodeURIComponent(link.getAttribute('href').slice(1))
        if (target) assert(ids.has(target), `Broken reference: #${target}`)
      }
      assert.equal(page.querySelectorAll('h1').length, 1, 'Paper title must be the only h1')
      for (const selector of ['.header-section-number', '.quarto-xref']) {
        assert.equal(
          content.querySelectorAll(selector).length,
          original.querySelectorAll(`body ${selector}`).length,
          `Lost ${selector}`
        )
      }
      const qmd = readFileSync(join(root, 'papers', paper.slug, 'index.qmd'), 'utf8')
      const numbering = qmd.match(/^section-numbers: (.+)$/m)
      assert(numbering, 'Snapshot is missing LaTeX section numbers')
      const sectionNumbers = JSON.parse(numbering[1])
      for (const [id, number] of Object.entries(sectionNumbers)) {
        assert.equal(
          content.querySelector(`#${id}`)?.getAttribute('data-paper-number'),
          number,
          `Wrong section number: ${id}`
        )
      }
      for (const link of content.querySelectorAll('a.paper-section-ref')) {
        const number = sectionNumbers[link.getAttribute('href').slice(1)]
        assert(number, `Missing section number: ${link.text}`)
        assert.equal(link.text.trim(), `${/^[A-Z]/.test(number) ? 'Appendix' : 'Section'} ${number}`)
      }
      const appendixHeadings = content
        .querySelectorAll('h2[data-paper-number]')
        .filter((heading) => /^[A-Z]$/.test(heading.getAttribute('data-paper-number')))
      assert.equal(article.querySelectorAll('.appendix-contents a').length, appendixHeadings.length)
      if (appendixHeadings.length) {
        const heading = article.querySelector('#appendix')
        assert.equal(heading?.text, 'Appendix')
        const siblings = heading.parentNode.childNodes.filter((node) => node.nodeType === 1)
        assert.equal(siblings[siblings.indexOf(heading) + 1], article.querySelector('.appendix-contents'))
      }
    })

    test('figures and tables survive and their assets exist', () => {
      assert.equal(content.querySelectorAll('th br').length, original.querySelectorAll('body th br').length)
      for (const selector of ['img', 'table', '.algorithm-change']) {
        assert.equal(
          content.querySelectorAll(selector).length,
          original.querySelectorAll(`body ${selector}`).length,
          `Lost ${selector}`
        )
      }
      for (const image of content.querySelectorAll('img[src]')) {
        const path = join(root, 'dist', image.getAttribute('src').replace(/^\/+/, ''))
        assert(existsSync(path), `Missing published figure: ${path}`)
        assert(image.getAttribute('alt'), 'Missing figure alternative text')
      }
    })
  })
}
