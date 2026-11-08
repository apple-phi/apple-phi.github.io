import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { TOCItem } from '../../src/types/content.types'

export interface Paper {
  slug: string
  title: string
  description: string
  html: string
  header: string
  bibtex: string
  arxiv: string
  toc: TOCItem[]
}

export function readPapers(): Paper[] {
  try {
    return JSON.parse(readFileSync(resolve('build/papers.json'), 'utf8')) as Paper[]
  } catch (cause) {
    throw new Error('Render manuscripts first: bun scripts/render-papers.ts', { cause })
  }
}
