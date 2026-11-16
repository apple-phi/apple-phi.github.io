const args = process.argv.slice(2)
const operation = args.shift()
const options = new Map<string, string>()
while (args.length) {
  const key = args.shift()!
  if (key === '--local' && !options.has(key)) {
    options.set(key, 'true')
    continue
  }
  const value = args.shift()
  if (!['--env', '--thread', '--text', '--id'].includes(key) || !value || options.has(key))
    throw new Error('Invalid arguments')
  options.set(key, value)
}
const environment = options.get('--env') ?? 'development'
if (!['development', 'production'].includes(environment)) throw new Error('Invalid environment')
const quote = (value: string) => `'${value.replaceAll("'", "''")}'`
let sql: string
if (operation === 'inbox') {
  sql = `SELECT c.token AS thread, c.name, c.created_at, m.sender, m.recipient, m.text FROM conversations c JOIN messages m ON m.sequence = (SELECT MAX(sequence) FROM messages WHERE thread = c.token) ORDER BY m.sequence DESC LIMIT 50;`
} else if (operation === 'thread') {
  const thread = options.get('--thread') ?? ''
  if (!/^[0-9a-f]{64}$/.test(thread)) throw new Error('A valid --thread is required')
  sql = `SELECT m.sequence, m.id, CASE WHEN m.sender = 'researcher' THEN 'researcher' ELSE c.name END AS sender, m.recipient, m.text, m.created_at FROM messages m JOIN conversations c ON c.token = m.thread WHERE m.thread = ${quote(thread)} OR (m.sender = 'visitor' AND (m.recipient = (SELECT name FROM conversations WHERE token = ${quote(thread)}) COLLATE NOCASE OR m.recipient = 'all')) ORDER BY m.sequence;`
} else if (operation === 'reply') {
  const thread = options.get('--thread') ?? ''
  const text = options.get('--text') ?? ''
  const id = options.get('--id') ?? crypto.randomUUID()
  if (!/^[0-9a-f]{64}$/.test(thread) || !text.trim() || [...text].length > 4000 || !/^[0-9a-f-]{36}$/i.test(id))
    throw new Error('Valid --thread, --text and optional UUID --id are required')
  console.log(`Reply ID: ${id}`)
  sql = `INSERT INTO messages (id, thread, sender, recipient, text) VALUES (${quote(id)}, ${quote(thread)}, 'researcher', (SELECT name FROM conversations WHERE token = ${quote(thread)}), ${quote(text)}) ON CONFLICT(id) DO UPDATE SET text = CASE WHEN messages.thread = excluded.thread AND messages.sender = excluded.sender AND messages.text = excluded.text THEN messages.text ELSE NULL END; SELECT id, thread, sender, recipient, text FROM messages WHERE id = ${quote(id)};`
} else {
  throw new Error(
    'Use inbox, thread --thread TOKEN, or reply --thread TOKEN --text TEXT [--id UUID] [--env development|production] [--local]'
  )
}
const command = Bun.spawn(
  [
    'bunx',
    '--no-install',
    'wrangler',
    'd1',
    'execute',
    'DB',
    '--env',
    environment,
    options.has('--local') ? '--local' : '--remote',
    '--command',
    sql,
    '--json'
  ],
  { cwd: import.meta.dir, stdout: 'inherit', stderr: 'inherit' }
)
if ((await command.exited) !== 0) throw new Error('Database command failed')
