import { test, expect } from 'bun:test'
import { Glob } from 'bun'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'node-html-parser'
import { themeConfig } from '../src/config'

test('every generated page inherits native navigation without link exceptions', () => {
  const dist = fileURLToPath(new URL('../dist/', import.meta.url))
  const pages = [...new Glob('**/*.html').scanSync({ cwd: dist })]
  expect(pages.length).toBeGreaterThan(0)
  for (const page of pages) {
    const html = parse(readFileSync(join(dist, page), 'utf8'))
    const head = html.querySelector('head')
    expect(head.querySelector('meta[name="astro-view-transitions-enabled"]')).toBeNull()
    expect(
      head.querySelectorAll('style').some((style) => /@view-transition\s*\{\s*navigation:\s*auto/.test(style.text))
    ).toBe(themeConfig.general.fadeAnimation)
    expect(html.querySelectorAll('a[data-astro-reload]')).toHaveLength(0)
  }
})
