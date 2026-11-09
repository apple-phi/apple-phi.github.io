import { satteri } from '@astrojs/markdown-satteri'
import { createRequire } from 'node:module'
import type { HastPluginEntry, MdastPluginEntry, MdastVisitorContext, MdastNode } from 'satteri'
import type { Element, RootContent } from 'hast'

type Context = Pick<MdastVisitorContext, 'data'>

// Config-loaded plugin closures outlive Vite's config module runner. Resolve
// optional modules through Node, so lazy loads still work after that runner closes.
const require = createRequire(import.meta.url)

function frontmatter(ctx: Context) {
  // Astro initializes this bag for both Markdown and MDX renderers.
  return ctx.data.astro!.frontmatter
}

function mark(ctx: Context, key: string) {
  const metadata = frontmatter(ctx)
  metadata.contentFeatures = { ...metadata.contentFeatures, [key]: true }
}

function classes(value: unknown): string[] {
  return Array.isArray(value) ? value : typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : []
}

function textOnly(node: Readonly<MdastNode>): string {
  if (node.type === 'text') return node.value
  return 'children' in node ? node.children.map(textOnly).join('') : ''
}

const directiveFeatures: Record<string, string> = {
  link: 'hasLinkCard',
  github: 'hasGithubCard',
  x: 'hasXPost',
  neodb: 'hasNeoDBCard'
}

const metadata: MdastPluginEntry = () => {
  const toc: { level: number; text: string; id: string; index: number }[] = []
  const slugs = new Set<string>()
  let headingIndex = 0
  const math = (displayMode: boolean) => async (node: Readonly<MdastNode>, ctx: MdastVisitorContext) => {
    if (!('value' in node)) return
    const katex = require('katex') as typeof import('katex')
    // Raw HTML must not be reinterpreted as MDX expressions.
    ctx.replaceNode(node, {
      raw: katex.renderToString(node.value, { displayMode, throwOnError: false }),
      mdxExpressions: false
    })
  }
  const directive = async (node: Readonly<MdastNode>, ctx: MdastVisitorContext) => {
    if (!('name' in node) || typeof node.name !== 'string') return
    const { embedHandlers } =
      require('../../src/plugins/remark-embedded-media.mjs') as typeof import('../../src/plugins/remark-embedded-media.mjs')
    const handler = embedHandlers[node.name as keyof typeof embedHandlers]
    if (!handler) return
    const html = handler(node)
    if (!html) return
    const feature = directiveFeatures[node.name]
    if (feature) mark(ctx, feature)
    // Insert an HTML node directly: these templates contain indentation and
    // blank lines that must not be reparsed as Markdown code blocks.
    ctx.replaceNode(node, { type: 'html', value: html })
  }
  return {
    name: 'chiri-metadata',
    async before(root, ctx) {
      const getReadingTime = require('reading-time') as typeof import('reading-time').default
      const reading = getReadingTime(ctx.textContent(root))
      const minutes = Math.max(1, Math.round(reading.minutes))
      Object.assign(frontmatter(ctx), {
        toc,
        minutesRead: `${minutes}min`,
        readingTime: { text: `${minutes}min`, minutes, time: reading.time, words: reading.words }
      })
    },
    heading(node, ctx) {
      if (node.depth > 3) return
      if (node.depth === 1 && headingIndex === 0) {
        headingIndex++
        return
      }
      const text = textOnly(node).trim()
      if (!text) return
      const slug = text
        .toLowerCase()
        .replace(/[^\u4e00-\u9fa5a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      let id = slug
      for (let counter = 1; slugs.has(id); counter++) id = `${slug}-${counter}`
      slugs.add(id)
      const data = node.data as { hProperties?: Record<string, unknown> } | undefined
      ctx.setField(node, 'data', { ...data, hProperties: { ...data?.hProperties, id } })
      toc.push({ level: node.depth, text, id, index: headingIndex++ })
    },
    image(_node, ctx) {
      mark(ctx, 'hasContentImage')
    },
    footnoteReference(_node, ctx) {
      mark(ctx, 'hasFootnotes')
    },
    math: math(true),
    inlineMath: math(false),
    leafDirective: directive,
    containerDirective: directive,
    textDirective: directive
  }
}

const imageAttributes: HastPluginEntry = () => {
  let firstImage = true
  return {
    name: 'chiri-image-attributes',
    element: {
      filter: ['img', 'li'],
      visit(node, ctx) {
        if (node.tagName === 'img') {
          ctx.setProperty(node, 'data-preview', 'true')
          ctx.setProperty(node, 'loading', 'lazy')
          ctx.setProperty(node, 'decoding', 'async')
          if (firstImage) ctx.setProperty(node, 'fetchpriority', 'high')
          firstImage = false
          const names = [...classes(node.properties.className), ...classes(node.properties.class)]
          if (!names.includes('img-placeholder')) names.push('img-placeholder')
          ctx.setProperty(node, 'class', null)
          ctx.setProperty(node, 'className', names)
        } else if (classes(node.properties.className).includes('task-list-item')) {
          let afterCheckbox = false
          for (const child of node.children) {
            if (child.type === 'element' && child.tagName === 'input' && child.properties.type === 'checkbox') {
              afterCheckbox = true
            } else if (afterCheckbox && child.type !== 'comment') {
              if (child.type === 'text') ctx.setField(child, 'value', child.value.replace(/^\s+/, ''))
              break
            }
          }
        }
      }
    }
  }
}

const markup: HastPluginEntry = {
  name: 'chiri-markup',
  element: {
    filter: ['p', 'pre'],
    visit(node, ctx) {
      if (node.tagName === 'pre') {
        if (!node.children.some((child) => child.type === 'element' && child.tagName === 'code')) return
        mark(ctx, 'hasCodeBlock')
        // Detach the subtree before replacing its parent in Sätteri's arena.
        const pre = JSON.parse(JSON.stringify(node)) as Element
        pre.properties.className = [
          ...classes(pre.properties.className),
          ...classes(pre.properties.class),
          'copy-code-block'
        ]
        delete pre.properties.class
        ctx.replaceNode(node, {
          type: 'element',
          tagName: 'div',
          properties: { className: ['copy-code-wrapper'] },
          children: [
            {
              type: 'element',
              tagName: 'button',
              properties: { className: ['copy-button'], type: 'button', 'aria-label': 'Copy code to clipboard' },
              children: []
            },
            pre
          ]
        })
        return
      }
      if (!node.children.length) return
      const images = node.children.filter(
        (child): child is Element => child.type === 'element' && child.tagName === 'img'
      )
      if (
        !images.length ||
        node.children.some(
          (child) =>
            !(child.type === 'element' && child.tagName === 'img') && !(child.type === 'text' && !child.value.trim())
        )
      )
        return
      ctx.replaceNode(
        node,
        images.map((image) => {
          const detached = JSON.parse(JSON.stringify(image)) as Element
          const alt = typeof image.properties.alt === 'string' ? image.properties.alt.trim() : ''
          if (!alt || alt.includes('_')) return detached
          return {
            type: 'element',
            tagName: 'figure',
            properties: { className: ['image-caption-wrapper'] },
            children: [
              detached,
              {
                type: 'element',
                tagName: 'figcaption',
                properties: { className: ['img-caption'] },
                children: [{ type: 'text', value: alt }]
              }
            ]
          } as RootContent
        })
      )
    }
  }
}

export const chiri = () =>
  satteri({
    features: { directive: true, math: true, rawHtml: true },
    mdastPlugins: [metadata],
    hastPlugins: [imageAttributes, markup]
  })
