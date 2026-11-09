import { defineConfig } from 'astro/config'
import { chiri } from './custom/markdown/chiri'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import { themeConfig } from './src/config'
import { imageConfig } from './src/utils/image-config'
import path from 'path'

export default defineConfig({
  site: themeConfig.site.website,
  compressHTML: true,
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: imageConfig
    }
  },
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
      wrap: false
    },
    processor: chiri()
  },
  integrations: [
    mdx(),
    {
      name: 'manuscripts',
      hooks: {
        'astro:config:setup': ({ injectRoute }) => {
          injectRoute({
            pattern: '/papers/[paper]/',
            entrypoint: new URL('./custom/manuscript/Page.astro', import.meta.url)
          })
        }
      }
    },
    sitemap()
  ],
  vite: {
    environments: {
      // Content sync can use Astro's published modules directly instead of
      // transforming the framework's runtime dependency tree through Vite.
      astro: { resolve: { external: ['astro'] } }
    },
    resolve: {
      alias: {
        '@': path.resolve('./src')
      }
    }
  },
  devToolbar: {
    enabled: false
  }
})
