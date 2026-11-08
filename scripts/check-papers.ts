import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'node-html-parser'
import { readPapers } from '../custom/manuscript/papers'

// Compare the final page with Quarto's output, not with a separately maintained
// bibliography or numbering scheme. Losing a scholarly feature fails the build.
for (const paper of readPapers()) {
  const original = parse(readFileSync(resolve('build/quarto/papers', paper.slug, 'index.html'), 'utf8'))
  const page = parse(readFileSync(resolve('dist/papers', paper.slug, 'index.html'), 'utf8'))
  const article = page.querySelector('article.manuscript')!
  assert(article, `${paper.slug}: missing article`)
  // Navigation repeats heading labels, including their math. Compare Quarto's
  // manuscript content separately from those generated navigation labels.
  const content = parse(article.innerHTML)
  content.querySelector('.appendix-contents')?.remove()
  assert.equal(page.querySelectorAll('h1').length, 1, 'The paper title must be the only h1')
  assert(!page.querySelector('link[href*="bootstrap"]'), 'Quarto must not style the site shell')
  assert(!page.querySelector('script[src*="mathjax"], script[src*="katex"]'), 'Math must render at build time')
  assert.equal(
    content.querySelectorAll('.katex').length,
    original.querySelectorAll('body .math').length,
    'Missing rendered math'
  )
  assert(!article.querySelector('.katex-error'), 'Invalid rendered math')
  const numberedMath = original.querySelectorAll('body .math.display').filter((math) => /\\tag\{/.test(math.text))
  const equationNumbers = article.querySelectorAll('.equation-number')
  assert(numberedMath.length > 0, 'Expected numbered display equations in the manuscript')
  assert.equal(equationNumbers.length, numberedMath.length, 'Missing visual equation numbers')
  for (const number of equationNumbers) {
    assert(number.classList.contains('katex-tag'), 'Unexpected KaTeX equation-number markup')
    assert(number.parentNode?.querySelector('.equation-formula'), 'Equation number has no formula cell')
  }
  for (const math of article.querySelectorAll('.math.display')) {
    assert(!math.closest('p'), 'Display equations must be standalone blocks, not embedded in paragraphs')
    assert(math.closest('.equation-block'), 'Display equation is missing its block wrapper')
    assert(math.querySelector('.equation-formula'), 'Display equation has no formula cell')
    assert(math.querySelector('.katex-mathml'), 'Display equation lost its accessible MathML')
  }

  for (const selector of [
    '.citation',
    '.csl-entry',
    '.math',
    '.header-section-number',
    'table',
    'img',
    '.footnote-ref',
    '.footnote-back',
    '.quarto-xref'
  ]) {
    assert.equal(
      content.querySelectorAll(selector).length,
      original.querySelectorAll(`body ${selector}`).length,
      `${paper.slug}: lost ${selector}`
    )
  }
  const ids = new Set(article.querySelectorAll('[id]').map((element) => element.id))
  assert.equal(ids.size, article.querySelectorAll('[id]').length, 'Duplicate article anchors')
  for (const element of original.querySelectorAll('body [id]')) {
    assert(ids.has(element.id), `Lost Quarto anchor: ${element.id}`)
  }
  const qmd = readFileSync(resolve('papers', paper.slug, 'index.qmd'), 'utf8')
  const numbering = qmd.match(/^section-numbers: (.+)$/m)
  assert(numbering, 'The snapshot must preserve LaTeX section numbers')
  const sectionNumbers = JSON.parse(numbering[1]) as Record<string, string>
  for (const [id, number] of Object.entries(sectionNumbers)) {
    const heading = article.querySelector(`#${id}`)
    assert.equal(heading?.getAttribute('data-paper-number'), number, `Wrong section number: ${id}`)
  }
  for (const link of article.querySelectorAll('a.paper-section-ref')) {
    const id = link.getAttribute('href')!.slice(1)
    const number = sectionNumbers[id]
    assert(number, `Missing section number: ${id}`)
    assert.equal(link.textContent.trim(), `${/^[A-Z]/.test(number) ? 'Appendix' : 'Section'} ${number}`)
  }
  assert.equal(page.querySelector('.manuscript-actions > a')?.getAttribute('href'), paper.arxiv)
  for (const title of article.querySelectorAll('.theorem-title')) {
    assert(/[.!?]$/.test(title.text.trim()), 'Theorem label is missing its punctuation')
  }
  assert.equal(
    article.querySelectorAll('.algorithm-change').length,
    original.querySelectorAll('.algorithm-change').length,
    'Lost algorithm differences'
  )
  const affiliationUrl = original.querySelector('#title-block-header')?.getAttribute('data-affiliation-url')
  if (affiliationUrl)
    assert.equal(article.querySelector('a.manuscript-affiliation-name')?.getAttribute('href'), affiliationUrl)
  const appendixLinks = article.querySelectorAll('.appendix-contents a')
  const appendixHeadings = content
    .querySelectorAll('h2[data-paper-number]')
    .filter((heading) => /^[A-Z]$/.test(heading.getAttribute('data-paper-number')!))
  assert.equal(appendixLinks.length, appendixHeadings.length, 'Incomplete appendix contents')
  if (appendixHeadings.length) {
    const heading = article.querySelector('#appendix')!
    assert.equal(heading.text, 'Appendix')
    const siblings = heading.parentNode!.childNodes.filter((node) => node.nodeType === 1)
    assert.equal(
      siblings[siblings.indexOf(heading) + 1],
      article.querySelector('.appendix-contents'),
      'Appendix TOC must follow its heading'
    )
  }
  // node-html-parser treats <pre> as raw text, unlike the browser DOM.
  const citation = page.querySelector('.citation-content pre')
  assert(citation, 'Missing BibTeX disclosure')
  assert.equal(parse(citation.innerHTML).querySelector('code')?.text, paper.bibtex)
  for (const link of page.querySelectorAll('a[href^="#"]')) {
    const target = decodeURIComponent(link.getAttribute('href')!.slice(1))
    if (target) assert(ids.has(target), `Broken reference: #${target}`)
  }
  const citations = article.querySelectorAll('.citation')
  assert(citations.length > 0 && article.querySelectorAll('.csl-entry').length > 0, 'Missing bibliography or citations')
  for (const citation of citations) {
    assert(citation.querySelector('a[href^="#ref-"]'), `Unlinked citation: ${citation.textContent}`)
  }
  for (const image of article.querySelectorAll('img[src]')) {
    assert(existsSync(resolve('dist', `.${image.getAttribute('src')}`)), 'Missing published figure')
    assert(image.getAttribute('alt'), 'Missing figure alternative text')
  }
  process.stdout.write(
    `Verified ${paper.slug}: ${citations.length} citations, ${article.querySelectorAll('.csl-entry').length} bibliography entries, ${ids.size} anchors, all figures and cross-references.\n`
  )
}
