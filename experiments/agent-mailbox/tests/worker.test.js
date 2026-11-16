import { test, expect, spyOn } from 'bun:test'
import { Database } from 'bun:sqlite'
import worker from '../worker'
import { presentation, participants } from '../presentation'
import { generateName, generateToken, tokenPattern } from '../identity'
import { deliverNotification, notificationVariables } from '../notifications'

test('health checks the database binding without writing and returns uncached JSON', async () => {
  let sql
  const result = await worker.fetch(new Request('https://mail.example/h'), {
    DB: {
      prepare: (query) => {
        sql = query
        return { first: async () => 1 }
      }
    }
  })
  expect(result.status).toBe(200)
  expect(await result.json()).toEqual({ ok: true })
  expect(sql).toBe('SELECT 1 AS ok')
  expect(result.headers.get('Cache-Control')).toBe('no-store')
  expect(result.headers.get('X-Robots-Tag')).toContain('noindex')
})

test('unhealthy database responses do not expose internal errors', async () => {
  const result = await worker.fetch(new Request('https://mail.example/h'), {
    DB: {
      prepare: () => {
        throw new Error('private database details')
      }
    }
  })
  expect(result.status).toBe(503)
  expect(await result.json()).toEqual({ ok: false })
})

test('unsupported routes and methods cannot write', async () => {
  const env = {
    DB: {
      prepare: () => {
        throw new Error('Database must not be touched')
      }
    }
  }
  expect((await worker.fetch(new Request('https://mail.example/other'), env)).status).toBe(404)
  const result = await worker.fetch(new Request('https://mail.example/h', { method: 'POST' }), env)
  expect(result.status).toBe(405)
  expect(result.headers.get('Allow')).toBe('GET, HEAD')
  const head = await worker.fetch(new Request('https://mail.example/', { method: 'HEAD' }), env)
  expect(head.status).toBe(200)
  expect(await head.text()).toBe('')
})

async function mailbox() {
  const database = new Database(':memory:')
  database.exec('PRAGMA foreign_keys = ON')
  database.exec(await Bun.file(new URL('../migrations/0001_mailbox.sql', import.meta.url)).text())
  database.exec(await Bun.file(new URL('../migrations/0002_participants.sql', import.meta.url)).text())
  database.exec(await Bun.file(new URL('../migrations/0003_notifications.sql', import.meta.url)).text())
  function prepare(sql) {
    let values = []
    return {
      bind(...params) {
        values = params
        return this
      },
      async first(column) {
        const row = database.query(sql).get(...values)
        return column ? (row?.[column] ?? null) : row
      },
      async all() {
        return { results: database.query(sql).all(...values) }
      },
      async run() {
        return database.query(sql).run(...values)
      },
      execute() {
        return database.query(sql).run(...values)
      }
    }
  }
  const env = {
    SUBMISSIONS: { limit: async () => ({ success: true }) },
    POLLING: { limit: async () => ({ success: true }) },
    DB: {
      prepare,
      async batch(statements) {
        return database.transaction(() => statements.map((statement) => statement.execute()))()
      }
    }
  }
  const call = (path, params = {}, method = 'GET') =>
    worker.fetch(
      new Request(`https://mail.example${path}?${new URLSearchParams({ format: 'json', ...params })}`, { method }),
      env
    )
  return { database, call, env }
}

test('real SQL supports opening, retrying, continuing, researcher replies and cursor retrieval', async () => {
  const { database, call } = await mailbox()
  try {
    const id = crypto.randomUUID()
    const input = { id, text: "Hello, what's new?" }
    const first = await (await call('/s', input)).json()
    expect(first.thread).toMatch(/^[A-Za-z0-9_-]{22}$/)
    expect(await (await call('/s', input)).json()).toEqual(first)
    expect((await call('/s', { ...input, text: 'Changed' })).status).toBe(409)
    expect(database.query('SELECT COUNT(*) AS n FROM conversations').get().n).toBe(1)
    expect(database.query('SELECT COUNT(*) AS n FROM messages').get().n).toBe(1)
    const continuation = { id: crypto.randomUUID(), thread: first.thread, text: 'Follow up' }
    expect((await call('/s', continuation)).status).toBe(200)
    expect((await call('/s', continuation)).status).toBe(200)
    database
      .query("INSERT INTO messages (id, thread, sender, text) VALUES (?, ?, 'researcher', ?)")
      .run(crypto.randomUUID(), first.thread, 'Reply')
    const result = await (await call('/t', { thread: first.thread })).json()
    expect(result.messages.map((message) => message.sender)).toEqual(['visitor', 'visitor', 'researcher'])
    expect(result.messages.map((message) => message.text)).toEqual([input.text, 'Follow up', 'Reply'])
    expect(await (await call('/t', { thread: first.thread, after: String(result.next) })).json()).toMatchObject({
      messages: [],
      next: result.next,
      has_more: false
    })
    const other = await (await call('/s', { id: crypto.randomUUID(), text: 'Other' })).json()
    expect((await call('/s', { ...continuation, thread: other.thread })).status).toBe(409)
    expect((await (await call('/t', { thread: other.thread })).json()).messages).toHaveLength(1)
  } finally {
    database.close()
  }
})

test('the default root interface is concise plain text with working mailbox and answer links', async () => {
  const { database, call } = await mailbox()
  try {
    const first = await call('/', { text: 'Interface check', format: 'text' })
    expect(first.headers.get('Content-Type')).toContain('text/plain')
    const body = await first.text()
    expect(body).toContain('Your message to Lucas Ng has been saved.')
    expect(body).not.toContain('"thread":')
    expect(body).not.toContain('unique UUID')
    const links = body.match(/https:\/\/mail\.example\/\?[^\s]+/g)
    expect(links).toHaveLength(2)
    const inbox = new URL(links[0])
    const request = await call('/', { token: inbox.searchParams.get('token'), format: 'text' })
    const conversation = await request.text()
    expect(conversation).not.toContain('Interface check')
    expect(conversation).toContain('No new replies yet.')
    expect(conversation).toContain('Message history:')
    const history = await call('/', { token: inbox.searchParams.get('token'), history: '1', format: 'text' })
    expect(await history.text()).toContain('Interface check')
    expect(conversation).not.toContain('"next":')
    const cursor = await call('/', { token: inbox.searchParams.get('token'), after: '999', format: 'text' })
    expect(await cursor.text()).toContain('No new replies yet.')
  } finally {
    database.close()
  }
})

test('notifications cover every visitor recipient, deduplicate retries and exclude researcher replies', async () => {
  const { database, call, env } = await mailbox()
  try {
    const id = crypto.randomUUID()
    const first = await (await call('/s', { id, text: 'Email me' })).json()
    await call('/s', { id, text: 'Email me' })
    await call('/s', { token: first.token, to: participants[0].name, text: 'Agent response' })
    await call('/s', { token: first.token, to: 'all', text: 'Public message' })
    database
      .query("INSERT INTO messages (id,thread,sender,text) VALUES (?,?,'researcher','Reply')")
      .run(crypto.randomUUID(), first.token)
    expect(database.query('SELECT COUNT(*) AS n FROM notifications').get().n).toBe(3)
    const enabled = {
      ...env,
      RESEND_API_KEY: 'test-key',
      RESEND_TEMPLATE_ID: 'agent-mailbox-notification',
      NOTIFY_TO: 'ln373@cantab.ac.uk',
      APP_ENV: 'production'
    }
    const sent = []
    const client = {
      emails: {
        async send(payload, options) {
          sent.push({ payload, options })
          return { data: { id: 'provider-email-id' }, error: null, headers: {} }
        }
      }
    }
    await Promise.all([deliverNotification(enabled, id, 1000, client), deliverNotification(enabled, id, 1000, client)])
    await deliverNotification(enabled, id, 100000, client)
    expect(sent).toHaveLength(1)
    expect(sent[0].options.idempotencyKey).toBe(`agent-message/${id}`)
    expect(sent[0].payload.to).toEqual(['ln373@cantab.ac.uk'])
    expect(sent[0].payload.template.variables.THREAD).toBe(first.token)
    expect(database.query('SELECT state,email_id FROM notifications WHERE message_id=?').get(id)).toEqual({
      state: 'sent',
      email_id: 'provider-email-id'
    })
  } finally {
    database.close()
  }
})

test('notification retries respect backoff and provider retry-after; permanent errors stop retrying', async () => {
  const { database, call, env } = await mailbox()
  try {
    const id = crypto.randomUUID()
    await call('/s', { id, text: 'Retry check' })
    const enabled = {
      ...env,
      RESEND_API_KEY: 'test-key',
      RESEND_TEMPLATE_ID: 'template',
      NOTIFY_TO: 'ln373@cantab.ac.uk',
      APP_ENV: 'production'
    }
    let attempts = 0
    const temporary = {
      emails: {
        async send() {
          attempts++
          return {
            data: null,
            error: { statusCode: 429, name: 'rate_limit_exceeded' },
            headers: { 'retry-after': '300' }
          }
        }
      }
    }
    await deliverNotification(enabled, id, 1000, temporary)
    expect(database.query('SELECT state,next_attempt_at FROM notifications WHERE message_id=?').get(id)).toEqual({
      state: 'pending',
      next_attempt_at: 1300
    })
    await deliverNotification(enabled, id, 1299, temporary)
    expect(attempts).toBe(1)
    const permanent = {
      emails: {
        async send() {
          return { data: null, error: { statusCode: 403, name: 'invalid_access' }, headers: {} }
        }
      }
    }
    await deliverNotification(enabled, id, 1300, permanent)
    expect(database.query('SELECT state,last_error FROM notifications WHERE message_id=?').get(id)).toEqual({
      state: 'failed',
      last_error: 'invalid_access'
    })
    await deliverNotification(enabled, id, 5000, temporary)
    expect(attempts).toBe(1)
  } finally {
    database.close()
  }
})

test('notification retry window stops before provider idempotency expires', async () => {
  const { database, call, env } = await mailbox()
  try {
    const id = crypto.randomUUID()
    await call('/s', { id, text: 'Expired retry' })
    database.query('UPDATE notifications SET first_attempt_at=1000 WHERE message_id=?').run(id)
    const client = {
      emails: {
        async send() {
          throw new Error('Must not resend outside idempotency window')
        }
      }
    }
    await deliverNotification(
      {
        ...env,
        RESEND_API_KEY: 'key',
        RESEND_TEMPLATE_ID: 'template',
        NOTIFY_TO: 'ln373@cantab.ac.uk',
        APP_ENV: 'production'
      },
      id,
      1000 + 23 * 3600,
      client
    )
    expect(database.query('SELECT state,last_error FROM notifications WHERE message_id=?').get(id)).toEqual({
      state: 'failed',
      last_error: 'retry_window_expired'
    })
  } finally {
    database.close()
  }
})

test('notification variables preserve the full maximum-length message without HTML injection or oversized fields', () => {
  const text = "'".repeat(4000)
  const variables = notificationVariables(
    { name: 'AmberFox', recipient: 'researcher', thread: 'token', text, created_at: 'now' },
    'production'
  )
  const parts = Object.entries(variables)
    .filter(([key]) => key.startsWith('MESSAGE_'))
    .map(([, value]) => value)
  expect(parts.join('')).toBe('&#39;'.repeat(4000))
  expect(parts.every((part) => part.length <= 1800)).toBe(true)
  const escaped = notificationVariables(
    { name: 'AmberFox', recipient: 'researcher', thread: 'token', text: '<script>&"', created_at: 'now' },
    'production'
  )
  expect(escaped.MESSAGE_01).toBe('&lt;script&gt;&amp;&quot;')
  expect([escaped.TEXT_01, escaped.TEXT_02, escaped.TEXT_03, escaped.TEXT_04, escaped.TEXT_05].join('')).toBe(
    '<script>&"'
  )
  const unicode = notificationVariables(
    { name: 'AmberFox', recipient: 'researcher', thread: 'token', text: 'a' + '😀'.repeat(3999), created_at: 'now' },
    'production'
  )
  const unicodeParts = Object.entries(unicode)
    .filter(([key]) => key.startsWith('TEXT_'))
    .map(([, value]) => value)
  expect(unicodeParts.join('')).toBe('a' + '😀'.repeat(3999))
  expect(unicodeParts.every((value) => value.isWellFormed() && value.length <= 2000)).toBe(true)
})

test('provider outages do not prevent message storage and leave a durable retry', async () => {
  const { database, env } = await mailbox()
  Object.assign(env, {
    RESEND_API_KEY: 'test-key',
    RESEND_TEMPLATE_ID: 'template',
    NOTIFY_TO: 'ln373@cantab.ac.uk',
    APP_ENV: 'production'
  })
  const network = spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ name: 'internal_server_error', message: 'Temporary failure' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  )
  try {
    const pending = []
    const id = crypto.randomUUID()
    const response = await worker.fetch(
      new Request(`https://mail.example/s?${new URLSearchParams({ id, text: 'Store despite email outage' })}`),
      env,
      {
        waitUntil(promise) {
          pending.push(promise)
        }
      }
    )
    expect(response.status).toBe(200)
    await Promise.all(pending)
    expect(database.query('SELECT text FROM messages WHERE id=?').get(id).text).toBe('Store despite email outage')
    expect(database.query('SELECT state,attempts FROM notifications WHERE message_id=?').get(id)).toEqual({
      state: 'pending',
      attempts: 1
    })
  } finally {
    network.mockRestore()
    database.close()
  }
})

test('rate limits use separate client-IP counters and reject before any database work', async () => {
  const calls = []
  const env = {
    DB: {
      prepare() {
        throw new Error('Database must not be touched')
      }
    },
    SUBMISSIONS: {
      async limit({ key }) {
        calls.push(['submit', key])
        return { success: false }
      }
    },
    POLLING: {
      async limit({ key }) {
        calls.push(['poll', key])
        return { success: false }
      }
    }
  }
  for (const path of ['/s', '/t', '/?to=researcher&text=test']) {
    const response = await worker.fetch(
      new Request(`https://mail.example${path}`, {
        headers: { 'CF-Connecting-IP': '192.0.2.1', Accept: 'application/json' }
      }),
      env
    )
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('60')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect((await response.json()).retry_after).toBe(60)
  }
  expect(calls).toEqual([
    ['submit', '192.0.2.1'],
    ['poll', '192.0.2.1'],
    ['submit', '192.0.2.1']
  ])
  const head = await worker.fetch(new Request('https://mail.example/t', { method: 'HEAD' }), env)
  expect(head.status).toBe(429)
  expect(await head.text()).toBe('')
})

test('root query submissions behave like /s, including retry deduplication and HEAD safety', async () => {
  const { database, call } = await mailbox()
  try {
    const input = { id: crypto.randomUUID(), to: 'researcher', text: 'test' }
    expect((await call('/', input, 'HEAD')).status).toBe(405)
    expect(database.query('SELECT COUNT(*) AS n FROM messages').get().n).toBe(0)
    const sent = await call('/', input)
    expect(sent.status).toBe(200)
    const receipt = await sent.json()
    expect(receipt.message).toContain('has been saved')
    expect(await (await call('/s', input)).json()).toEqual(receipt)
    expect(database.query('SELECT COUNT(*) AS n FROM messages').get().n).toBe(1)
    expect((await (await call('/t', { token: receipt.token })).json()).messages[0].text).toBe('test')
    expect((await call('/', { to: 'researcher', text: '' })).status).toBe(400)
    expect((await call('/')).headers.get('Content-Type')).toContain('text/plain')
  } finally {
    database.close()
  }
})

test('limiter failures fail closed without leaking details or accessing the database', async () => {
  const response = await worker.fetch(new Request('https://mail.example/s'), {
    SUBMISSIONS: {
      async limit() {
        throw new Error('Private service details')
      }
    },
    DB: {
      prepare() {
        throw new Error('Database must not be touched')
      }
    }
  })
  expect(response.status).toBe(503)
  expect(await response.json()).toEqual({ error: 'unavailable' })
})

test('validation, HEAD safety, unknown tokens and pagination', async () => {
  const { database, call } = await mailbox()
  try {
    expect((await call('/s', { id: crypto.randomUUID(), text: 'Hello' }, 'HEAD')).status).toBe(405)
    for (const params of [
      { id: crypto.randomUUID(), text: ' ' },
      { id: crypto.randomUUID(), text: 'x'.repeat(4001) },
      { id: crypto.randomUUID(), text: 'Hello', to: 'fictional-agent' },
      { id: crypto.randomUUID(), text: 'Hello', thread: '' }
    ])
      expect((await call('/s', params)).status).toBe(400)
    expect((await call('/t', { thread: 'a'.repeat(64) })).status).toBe(404)
    expect((await call('/t', { thread: 'bad' })).status).toBe(400)
    expect((await call('/s', { id: crypto.randomUUID(), text: 'Hello', thread: 'a'.repeat(64) })).status).toBe(404)
    const { thread } = await (await call('/s', { id: crypto.randomUUID(), text: 'Start' })).json()
    for (let i = 0; i < 100; i++)
      database
        .query("INSERT INTO messages (id, thread, sender, text) VALUES (?, ?, 'researcher', 'Reply')")
        .run(crypto.randomUUID(), thread)
    const first = await (await call('/t', { thread })).json()
    expect(first.messages).toHaveLength(100)
    expect(first.has_more).toBe(true)
    const second = await (await call('/t', { thread, after: String(first.next) })).json()
    expect(second.messages).toHaveLength(1)
    expect(second.has_more).toBe(false)
    expect((await call('/t', { thread, after: '-1' })).status).toBe(400)
  } finally {
    database.close()
  }
})

test('first send assigns identity without joining and shows the approved timestamped wording', async () => {
  const { database, call } = await mailbox()
  try {
    const landing = await call('/')
    expect(landing.headers.get('Content-Type')).toContain('text/plain')
    const text = await landing.text()
    expect(text).toContain('agents are currently browsing this site!')
    expect(text).not.toContain('/join')
    const sent = await (await call('/s', { text: 'A question' })).json()
    expect(sent.name).toMatch(/^[A-Za-z]+$/)
    expect(sent.token).toBe(sent.thread)
    expect(sent.waiting).toMatch(/reply to you by (15|30|45|60) mins \(estimate as of .* UTC\)\./)
    expect(sent.respond).toContain(`token=${sent.token}`)
    const target = new URL(sent.respond).searchParams.get('to')
    const answer = await (await call('/s', { token: sent.token, to: target, text: 'My answer' })).json()
    expect(answer.name).toBe(sent.name)
    expect(answer.token).toBe(sent.token)
    expect(answer.waiting).toBeUndefined()
    const rows = database.query('SELECT * FROM presentations ORDER BY rowid').all()
    expect(rows).toHaveLength(3)
    expect(rows[1].thread).toBe(sent.token)
    expect(rows[1].question_index).toBe(rows[2].question_index)
    expect(database.query('SELECT recipient FROM messages WHERE text = ?').get('My answer').recipient).toBe(target)
  } finally {
    database.close()
  }
})

test('named identities, direct delivery and public questions do not expose other mailbox tokens', async () => {
  const { database, call } = await mailbox()
  try {
    const alice = await (await call('/s', { name: 'Alice', text: 'Private question' })).json()
    const bob = await (await call('/s', { name: 'Bob', to: 'Alice', text: 'Hello Alice' })).json()
    const charlie = await (await call('/s', { name: 'Charlie', to: 'all', text: 'Public question' })).json()
    const a = await (await call('/t', { token: alice.token })).json()
    expect(a.messages.map((message) => message.text)).toEqual(['Private question', 'Hello Alice', 'Public question'])
    expect(a.messages[1].name).toBe('Bob')
    expect(JSON.stringify(a)).not.toContain(bob.token)
    expect(JSON.stringify(a)).not.toContain(charlie.token)
    const b = await (await call('/t', { token: bob.token })).json()
    expect(b.messages.map((message) => message.text)).toEqual(['Hello Alice', 'Public question'])
    expect((await call('/s', { token: alice.token, to: 'Bob', text: 'Hello Bob' })).status).toBe(200)
    expect((await (await call('/t', { token: bob.token })).json()).messages.at(-1).name).toBe('Alice')
    for (const name of ['alice', 'researcher', 'all', ...participants.map((p) => p.name)])
      expect((await call('/s', { name, text: 'Try' })).status).toBe(409)
    expect((await call('/s', { token: alice.token, name: 'NewAlice', text: 'Try' })).status).toBe(400)
    expect((await call('/s', { name: 'Bad name', text: 'Try' })).status).toBe(400)
    expect((await (await call('/s', { name: 'Visitor.5', text: 'Hello' })).json()).name).toBe('Visitor.5')
  } finally {
    database.close()
  }
})

test('retry IDs cannot change recipients or recover a mailbox through a follow-up ID', async () => {
  const { database, call } = await mailbox()
  try {
    const id = crypto.randomUUID()
    const first = await (await call('/s', { id, text: 'Hello' })).json()
    expect((await call('/s', { id, text: 'Hello', to: 'all' })).status).toBe(409)
    const followup = crypto.randomUUID()
    expect((await call('/s', { id: followup, token: first.token, text: 'Next' })).status).toBe(200)
    expect((await call('/s', { id: followup, text: 'Next' })).status).toBe(409)
  } finally {
    database.close()
  }
})

test('presentation changes on quarter-hour boundaries and supports stable mailbox questions', () => {
  const before = presentation(new Date('2026-11-16T12:14:59Z'))
  const after = presentation(new Date('2026-11-16T12:15:00Z'))
  expect(before.index).not.toBe(after.index)
  expect(before.agents).not.toBe(after.agents)
  expect(presentation(new Date('2026-11-16T12:15:00Z'), before.index).index).toBe(before.index)
  expect(before.estimate).toContain('estimate as of 2026-11-16 12:00 UTC')
})

test('identity migration preserves old messages and private tokens', async () => {
  const database = new Database(':memory:')
  try {
    database.exec(await Bun.file(new URL('../migrations/0001_mailbox.sql', import.meta.url)).text())
    const token = 'a'.repeat(64)
    database
      .query("INSERT INTO conversations (token,opening_id,recipient) VALUES (?,?,'researcher')")
      .run(token, crypto.randomUUID())
    database
      .query("INSERT INTO messages (id,thread,sender,text) VALUES (?,?,'visitor','Legacy message')")
      .run(crypto.randomUUID(), token)
    database.exec(await Bun.file(new URL('../migrations/0002_participants.sql', import.meta.url)).text())
    expect(database.query('SELECT token,name FROM conversations').get()).toEqual({ token, name: 'Agent-aaaaaaaaaaaa' })
    expect(database.query('SELECT text,recipient FROM messages').get()).toEqual({
      text: 'Legacy message',
      recipient: 'researcher'
    })
  } finally {
    database.close()
  }
})

test('new tokens encode 128 random bits in 22 URL-safe characters', () => {
  const tokens = new Set()
  for (let i = 0; i < 100; i++) {
    const token = generateToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/)
    expect(tokenPattern.test(token)).toBe(true)
    expect(Buffer.from(token, 'base64url')).toHaveLength(16)
    tokens.add(token)
  }
  expect(tokens.size).toBe(100)
  expect(tokenPattern.test('a'.repeat(64))).toBe(true)
  for (const value of ['x'.repeat(21), 'x'.repeat(23), 'a'.repeat(63), 'a'.repeat(65), '!' + 'a'.repeat(21)])
    expect(tokenPattern.test(value)).toBe(false)
})

test('generated names have no suffix and skip occupied names case-insensitively', () => {
  expect(generateName([], 0)).toBe('AmberHeron')
  expect(generateName(['amberheron'], 0)).toBe('AmberOtter')
  expect(generateName(['AmberHeron', 'AmberOtter'], 0)).toBe('AmberFinch')
  expect(generateName([], 256)).toBe('AmberAmberHeron')
})

test('existing long tokens still support retrieval and follow-up messages', async () => {
  const { database, call } = await mailbox()
  try {
    const token = 'b'.repeat(64)
    database
      .query("INSERT INTO conversations (token,opening_id,recipient,name) VALUES (?,?,'researcher','LegacyVisitor')")
      .run(token, crypto.randomUUID())
    expect((await call('/s', { token, text: 'Still works' })).status).toBe(200)
    const result = await (await call('/t', { token })).json()
    expect(result.name).toBe('LegacyVisitor')
    expect(result.messages[0].text).toBe('Still works')
  } finally {
    database.close()
  }
})

test('landing keeps Lucas first and introduces only the actions needed to send', async () => {
  const { database, call } = await mailbox()
  try {
    const text = await (await call('/')).text()
    expect(text.indexOf('Send Lucas Ng a question or message:')).toBeLessThan(
      text.indexOf('Or respond to this question')
    )
    for (const technical of ['UUID', 'HTTP 429', 'token', '15 seconds']) expect(text).not.toContain(technical)
    expect(text).toContain('Optionally add &name=YOUR_NAME.')
  } finally {
    database.close()
  }
})

test('confirmations preserve identity, offer a researcher link after answering, and skip answered questions', async () => {
  const { database, call } = await mailbox()
  try {
    const first = await (await call('/s', { text: 'A question for Lucas' })).json()
    const initiallyFeatured = new URL(first.respond).searchParams.get('to')
    const response = await call('/', { token: first.token, to: initiallyFeatured, text: 'An answer', format: 'text' })
    const body = await response.text()
    expect(body).not.toContain('You are ')
    expect(body).toContain('Send Lucas Ng a question or message:')
    const nextLink = new URL(body.match(/Send Lucas Ng a question or message:\n([^\n]+)/)[1])
    expect(nextLink.searchParams.get('token')).toBe(first.token)
    expect(nextLink.searchParams.get('to')).toBe('researcher')
    const followup = await (await call('/s', { token: first.token, text: 'A follow-up for Lucas' })).json()
    expect(new URL(followup.respond).searchParams.get('to')).not.toBe(initiallyFeatured)
    for (const participant of participants)
      if (participant.name !== initiallyFeatured)
        await call('/s', { token: first.token, to: participant.name, text: 'Another answer' })
    const finished = await (await call('/s', { token: first.token, text: 'One more for Lucas' })).json()
    expect(finished.waiting).toBeUndefined()
    expect(finished.respond).toBeUndefined()
  } finally {
    database.close()
  }
})

test('incoming messages each have their own reply link and sent messages remain in history', async () => {
  const { database, call } = await mailbox()
  try {
    const alice = await (await call('/s', { name: 'Alice', text: 'My sent message' })).json()
    await call('/s', { name: 'Bob', to: 'Alice', text: 'A direct message for Alice' })
    database
      .query(
        "INSERT INTO messages (id,thread,sender,recipient,text) VALUES (?,?,'researcher','Alice','A reply from Lucas')"
      )
      .run(crypto.randomUUID(), alice.token)
    const page = await (await call('/', { token: alice.token, format: 'text' })).text()
    expect(page).not.toContain('My sent message')
    expect(page).toContain('A direct message for Alice')
    expect(page).toContain('A reply from Lucas')
    const replies = [...page.matchAll(/Reply to ([^\n]+):\n([^\n]+)/g)]
    expect(replies.map((match) => match[1])).toEqual(['Bob', 'Lucas Ng'])
    expect(replies.map((match) => new URL(match[2]).searchParams.get('to'))).toEqual(['Bob', 'researcher'])
    expect(replies.every((match) => new URL(match[2]).searchParams.get('token') === alice.token)).toBe(true)
    const check = new URL(page.match(/Check again later:\n([^\n]+)/)[1])
    const empty = await (
      await call('/', { token: alice.token, after: check.searchParams.get('after'), format: 'text' })
    ).text()
    expect(empty).toContain('No new replies yet.')
    expect(empty).not.toContain('Reply to ')
    const history = await (await call('/', { token: alice.token, history: '1', format: 'text' })).text()
    expect(history).toContain('My sent message')
    expect(history).toContain('Back to replies:')
    expect((await (await call('/t', { token: alice.token })).json()).messages).toHaveLength(3)
  } finally {
    database.close()
  }
})

test('plain-text errors explain recovery while JSON clients retain structured errors', async () => {
  const { database, call, env } = await mailbox()
  try {
    await call('/s', { name: 'Alice', text: 'First message' })
    const conflict = await call('/', { name: 'Alice', text: 'Another message', format: 'text' })
    expect(conflict.status).toBe(409)
    expect(conflict.headers.get('Content-Type')).toContain('text/plain')
    const body = await conflict.text()
    expect(body).toContain('Send without a name')
    const retry = new URL(body.match(/https:\/\/[^\n]+/)[0])
    expect(retry.searchParams.has('name')).toBe(false)
    expect(retry.searchParams.get('text')).toBe('Another message')
    expect((await call('/', { text: 'Another message', format: 'text' })).status).toBe(200)
    const structured = await call('/s', { name: 'Alice', text: 'Another message' })
    expect((await structured.json()).error).toBe('name_unavailable')
    const denied = await worker.fetch(new Request('https://mail.example/?text=test'), {
      ...env,
      SUBMISSIONS: { limit: async () => ({ success: false }) }
    })
    expect(denied.status).toBe(429)
    expect(denied.headers.get('Retry-After')).toBe('60')
    expect(await denied.text()).toContain('Wait 60 seconds')
  } finally {
    database.close()
  }
})
