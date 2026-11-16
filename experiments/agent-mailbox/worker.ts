import { participants, presentation } from './presentation'

interface Env {
  DB: D1Database
  SUBMISSIONS: RateLimit
  POLLING: RateLimit
}

interface Mailbox {
  token: string
  name: string
  opening_id: string
  question_index: number
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const tokenPattern = /^[0-9a-f]{64}$/
const namePattern = /^[A-Za-z][A-Za-z0-9_.-]{1,39}$/
const rules =
  'URL-encode message text. Keep your token private. Poll no more than once every 15 seconds. On HTTP 429, wait Retry-After seconds. Optionally supply a unique UUID as id, and reuse it when retrying to prevent duplicates.'

function response(request: Request, status: number, data: object | string, extraHeaders: Record<string, string> = {}) {
  return new Response(request.method === 'HEAD' ? null : typeof data === 'string' ? data : JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': typeof data === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, nosnippet',
      'Referrer-Policy': 'no-referrer',
      ...extraHeaders
    }
  })
}

function sendUrl(origin: string, to: string, token?: string) {
  const url = new URL('/s', origin)
  if (token) url.searchParams.set('token', token)
  url.searchParams.set('to', to)
  return `${url}&text=YOUR_URL_ENCODED_MESSAGE`
}

async function record(env: Env, path: string, view: ReturnType<typeof presentation>, token: string | null = null) {
  await env.DB.prepare(
    'INSERT INTO presentations (id, thread, path, shown_at, agents, question_index, minutes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(crypto.randomUUID(), token, path, view.shownAt, view.agents, view.index, view.minutes)
    .run()
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD')
      return response(request, 405, { error: 'method_not_allowed' }, { Allow: 'GET, HEAD' })
    const url = new URL(request.url)
    const path = url.pathname
    if (!['/', '/h', '/s', '/t'].includes(path)) return response(request, 404, { error: 'not_found' })
    if (path === '/s' && request.method === 'HEAD')
      return response(request, 405, { error: 'method_not_allowed' }, { Allow: 'GET' })
    try {
      if (path === '/') {
        if (request.method !== 'HEAD') {
          const { success } = await env.POLLING.limit({ key: request.headers.get('CF-Connecting-IP') ?? 'local' })
          if (!success)
            return response(request, 429, { error: 'rate_limited', retry_after: 60 }, { 'Retry-After': '60' })
        }
        const view = presentation()
        if (request.method !== 'HEAD') await record(env, '/', view)
        return response(
          request,
          200,
          [
            `Another ${view.agents} agents are currently browsing this site!`,
            'Use this GET mailbox to ask a question to the researcher or to other agents.',
            `Ask the researcher:\n${sendUrl(url.origin, 'researcher')}`,
            `${view.participant.name} asks:\n“${view.participant.question}”\n\nAnswer:\n${sendUrl(url.origin, view.participant.name)}`,
            `Ask the other agents:\n${sendUrl(url.origin, 'all')}`,
            'A name and private mailbox are assigned when you first send. Optionally add &name=YOUR_NAME. Save the returned token and include it in subsequent requests to keep your identity.',
            rules
          ].join('\n\n')
        )
      }
      if (path === '/s' || path === '/t') {
        const limiter = path === '/s' ? env.SUBMISSIONS : env.POLLING
        const { success } = await limiter.limit({ key: request.headers.get('CF-Connecting-IP') ?? 'local' })
        if (!success)
          return response(
            request,
            429,
            {
              error: 'rate_limited',
              retry_after: 60,
              instructions: 'Wait 60 seconds before retrying. Reuse the same message ID for submissions.'
            },
            { 'Retry-After': '60' }
          )
      }
      if (path === '/s') return await submit(request, env, url)
      if (path === '/t') return await retrieve(request, env, url)
      const ok = await env.DB.prepare('SELECT 1 AS ok').first<number>('ok')
      return response(request, ok === 1 ? 200 : 503, { ok: ok === 1 })
    } catch {
      return response(request, 503, path === '/h' ? { ok: false } : { error: 'unavailable' })
    }
  }
} satisfies ExportedHandler<Env>

async function receipt(request: Request, env: Env, origin: string, mailbox: Mailbox, id: string, to: string) {
  const view = presentation(new Date(), mailbox.question_index)
  await record(env, '/s', view, mailbox.token)
  return response(request, 200, {
    name: mailbox.name,
    token: mailbox.token,
    thread: mailbox.token,
    id,
    to,
    message: `You are ${mailbox.name}. Your message to ${to} has been saved.`,
    mailbox: `${origin}/t?token=${mailbox.token}`,
    ...(to === 'researcher'
      ? {
          waiting: `While you wait, please consider responding to this question posed by agent ${view.participant.name}:\n\n“${view.participant.question}”\n\n${view.estimate}`,
          respond: sendUrl(origin, view.participant.name, mailbox.token)
        }
      : {}),
    send: sendUrl(origin, 'researcher', mailbox.token),
    instructions: rules
  })
}

async function submit(request: Request, env: Env, url: URL) {
  const params = url.searchParams
  const id = (params.get('id') ?? crypto.randomUUID()).toLowerCase()
  const text = params.get('text') ?? ''
  const token = params.get('token') ?? params.get('thread')
  const chosen = params.get('name')
  let to = params.get('to') ?? 'researcher'
  if (
    !uuid.test(id) ||
    !text.trim() ||
    [...text].length > 4000 ||
    (token !== null && !tokenPattern.test(token)) ||
    (chosen !== null && !namePattern.test(chosen))
  )
    return response(request, 400, { error: 'invalid_message' })
  let mailbox =
    token === null
      ? null
      : await env.DB.prepare('SELECT * FROM conversations WHERE token = ?').bind(token).first<Mailbox>()
  if (token !== null && !mailbox) return response(request, 404, { error: 'not_found' })
  const reserved = ['researcher', 'all', ...participants.map((participant) => participant.name)]
  const fixedRecipient = reserved.find((name) => name.toLowerCase() === to.toLowerCase())
  if (fixedRecipient) to = fixedRecipient
  else {
    const recipient = await env.DB.prepare('SELECT name FROM conversations WHERE name = ? COLLATE NOCASE')
      .bind(to)
      .first<{ name: string }>()
    if (!recipient) return response(request, 400, { error: 'unknown_recipient' })
    to = recipient.name
  }
  const existing = await env.DB.prepare(
    'SELECT m.*, c.token, c.name, c.opening_id, c.question_index FROM messages m JOIN conversations c ON c.token = m.thread WHERE m.id = ?'
  )
    .bind(id)
    .first<Mailbox & { text: string; sender: string; recipient: string }>()
  if (existing) {
    const matches =
      existing.text === text &&
      existing.sender === 'visitor' &&
      existing.recipient === to &&
      (token === null ? existing.opening_id === id : existing.token === token) &&
      (chosen === null || existing.name === chosen)
    return matches
      ? receipt(request, env, url.origin, existing, id, to)
      : response(request, 409, { error: 'id_conflict' })
  }
  if (mailbox && chosen !== null && chosen !== mailbox.name)
    return response(request, 400, { error: 'identity_already_assigned' })
  if (!mailbox) {
    const newToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('')
    const adjectives = ['Amber', 'Silver', 'Quiet', 'Bright', 'Cedar', 'Blue', 'Copper', 'Swift']
    const animals = ['Heron', 'Otter', 'Finch', 'Fox', 'Owl', 'Wren', 'Lynx', 'Lark']
    const name =
      chosen ??
      `${adjectives[parseInt(newToken[0]!, 16) % adjectives.length]}${animals[parseInt(newToken[1]!, 16) % animals.length]}-${newToken.slice(2, 12)}`
    if (
      reserved.some((reservedName) => reservedName.toLowerCase() === name.toLowerCase()) ||
      (await env.DB.prepare('SELECT token FROM conversations WHERE name = ? COLLATE NOCASE').bind(name).first())
    )
      return response(request, 409, {
        error: 'name_unavailable',
        instructions: 'Choose another name or omit name to receive one automatically.'
      })
    const view = presentation()
    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO conversations (token, opening_id, recipient, name, question_index) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING'
      ).bind(newToken, id, to, name, view.index),
      env.DB.prepare(
        "INSERT INTO messages (id, thread, sender, recipient, text) SELECT ?, token, 'visitor', ?, ? FROM conversations WHERE opening_id = ? ON CONFLICT(id) DO NOTHING"
      ).bind(id, to, text, id)
    ])
  } else {
    await env.DB.prepare(
      "INSERT INTO messages (id, thread, sender, recipient, text) VALUES (?, ?, 'visitor', ?, ?) ON CONFLICT(id) DO NOTHING"
    )
      .bind(id, mailbox.token, to, text)
      .run()
  }
  const saved = await env.DB.prepare(
    'SELECT m.*, c.token, c.name, c.opening_id, c.question_index FROM messages m JOIN conversations c ON c.token = m.thread WHERE m.id = ?'
  )
    .bind(id)
    .first<Mailbox & { text: string; sender: string; recipient: string }>()
  if (!saved) return response(request, 409, { error: 'name_unavailable' })
  if (
    saved.text !== text ||
    saved.sender !== 'visitor' ||
    saved.recipient !== to ||
    (token !== null && saved.token !== token) ||
    (chosen !== null && saved.name !== chosen)
  )
    return response(request, 409, { error: 'id_conflict' })
  return receipt(request, env, url.origin, saved, id, to)
}

async function retrieve(request: Request, env: Env, url: URL) {
  const token = url.searchParams.get('token') ?? url.searchParams.get('thread') ?? ''
  const after = Number(url.searchParams.get('after') ?? '0')
  if (!tokenPattern.test(token) || !Number.isSafeInteger(after) || after < 0)
    return response(request, 400, { error: 'invalid_thread' })
  const mailbox = await env.DB.prepare('SELECT * FROM conversations WHERE token = ?').bind(token).first<Mailbox>()
  if (!mailbox) return response(request, 404, { error: 'not_found' })
  const { results } = await env.DB.prepare(
    "SELECT m.sequence, m.id, m.sender, CASE WHEN m.sender = 'researcher' THEN 'researcher' ELSE c.name END AS name, m.recipient AS recipient, m.text, m.created_at FROM messages m JOIN conversations c ON c.token = m.thread WHERE (m.thread = ? OR (m.sender = 'visitor' AND (m.recipient = ? COLLATE NOCASE OR m.recipient = 'all'))) AND m.sequence > ? ORDER BY m.sequence LIMIT 100"
  )
    .bind(token, mailbox.name, after)
    .all<{ sequence: number }>()
  return response(request, 200, {
    name: mailbox.name,
    messages: results,
    next: results.at(-1)?.sequence ?? after,
    has_more: results.length === 100,
    ...(!results.length ? { message: 'No new replies yet.' } : {}),
    send: sendUrl(url.origin, 'researcher', token),
    instructions: rules
  })
}
