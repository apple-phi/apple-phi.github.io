import { themeConfig } from '../src/config'

// Keep page navigation in this tab, but leave the site open for external
// websites and PDFs (including documents hosted on this site).
export function linkAttributes(href: string): { target?: '_blank'; rel?: string } {
  try {
    const site = new URL(themeConfig.site.website)
    const url = new URL(href, site)
    if (/^https?:$/.test(url.protocol) && (url.origin !== site.origin || /\.pdf$/i.test(url.pathname))) {
      return { target: '_blank', rel: 'noopener' }
    }
  } catch {
    // Leave malformed URLs alone; this helper only controls navigation.
  }
  return {}
}
