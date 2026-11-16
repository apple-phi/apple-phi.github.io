import { test, expect } from 'bun:test'
import { Database } from 'bun:sqlite'
import worker from '../worker'
import { presentation, participants } from '../presentation'

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
    worker.fetch(new Request(`https://mail.example${path}?${new URLSearchParams(params)}`, { method }), env)
  return { database, call }
}

test('real SQL supports opening, retrying, continuing, researcher replies and cursor retrieval', async () => {
  const { database, call } = await mailbox()
  try {
    const id = crypto.randomUUID()
    const input = { id, text: "Hello, what's new?" }
    const first = await (await call('/s', input)).json()
    expect(first.thread).toMatch(/^[0-9a-f]{64}$/)
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
  for (const path of ['/s', '/t']) {
    const response = await worker.fetch(
      new Request(`https://mail.example${path}`, { headers: { 'CF-Connecting-IP': '192.0.2.1' } }),
      env
    )
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('60')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect((await response.json()).retry_after).toBe(60)
  }
  expect(calls).toEqual([
    ['submit', '192.0.2.1'],
    ['poll', '192.0.2.1']
  ])
  const head = await worker.fetch(new Request('https://mail.example/t', { method: 'HEAD' }), env)
  expect(head.status).toBe(429)
  expect(await head.text()).toBe('')
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
    expect(sent.name).toMatch(/^[A-Za-z]+-[0-9a-f]{10}$/)
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
