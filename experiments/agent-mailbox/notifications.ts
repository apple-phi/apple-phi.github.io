import { Resend } from 'resend'

export interface NotificationEnv {
  DB: D1Database
  RESEND_API_KEY?: string
  RESEND_TEMPLATE_ID?: string
  NOTIFY_TO?: string
  APP_ENV?: 'production' | 'development'
}

const messageKeys = Array.from({ length: 14 }, (_, index) => `MESSAGE_${String(index + 1).padStart(2, '0')}`)
const textKeys = Array.from({ length: 5 }, (_, index) => `TEXT_${String(index + 1).padStart(2, '0')}`)

function chunks(value: string, limit: number) {
  const parts: string[] = []
  for (let offset = 0; offset < value.length;) {
    let end = Math.min(offset + limit, value.length)
    const last = value.charCodeAt(end - 1)
    if (end < value.length && last >= 0xd800 && last <= 0xdbff) end--
    parts.push(value.slice(offset, end))
    offset = end
  }
  return parts
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function notificationVariables(
  message: { name: string; recipient: string; thread: string; text: string; created_at: string },
  environment: string
) {
  const escaped = escapeHtml(message.text)
  const htmlParts = chunks(escaped, 1800)
  const textParts = chunks(message.text, 1900)
  return {
    SENDER: message.name,
    RECIPIENT: message.recipient,
    THREAD: message.thread,
    ENVIRONMENT: environment,
    POSTED_AT: message.created_at,
    ...Object.fromEntries(messageKeys.map((key, index) => [key, htmlParts[index] ?? ''])),
    ...Object.fromEntries(textKeys.map((key, index) => [key, textParts[index] ?? '']))
  }
}

export async function deliverNotification(
  env: NotificationEnv,
  id: string,
  now = Math.floor(Date.now() / 1000),
  client?: Pick<Resend, 'emails'>
) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_TO || !env.RESEND_TEMPLATE_ID || !env.APP_ENV) return
  const claimed = await env.DB.prepare(
    "UPDATE notifications SET attempts = attempts + 1, first_attempt_at = COALESCE(first_attempt_at, ?), lease_until = ? WHERE message_id = ? AND state = 'pending' AND next_attempt_at <= ? AND lease_until <= ? RETURNING attempts, first_attempt_at"
  )
    .bind(now, now + 120, id, now, now)
    .first<{ attempts: number; first_attempt_at: number }>()
  if (!claimed) return
  if (now - claimed.first_attempt_at >= 23 * 3600) {
    await env.DB.prepare(
      "UPDATE notifications SET state = 'failed', lease_until = 0, last_error = 'retry_window_expired' WHERE message_id = ?"
    )
      .bind(id)
      .run()
    return
  }
  const message = await env.DB.prepare(
    'SELECT m.text, m.thread, m.recipient, m.created_at, c.name FROM messages m JOIN conversations c ON c.token = m.thread WHERE m.id = ?'
  )
    .bind(id)
    .first<{ text: string; thread: string; recipient: string; created_at: string; name: string }>()
  if (!message) throw new Error('Notification message missing')
  const resend = client ?? new Resend(env.RESEND_API_KEY)
  const { data, error, headers } = await resend.emails.send(
    {
      from: 'Agent mailbox <onboarding@resend.dev>',
      to: [env.NOTIFY_TO],
      template: { id: env.RESEND_TEMPLATE_ID, variables: notificationVariables(message, env.APP_ENV) }
    },
    { idempotencyKey: `agent-message/${id}` }
  )
  if (!error && data?.id) {
    await env.DB.prepare(
      "UPDATE notifications SET state = 'sent', email_id = ?, sent_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), lease_until = 0, last_error = NULL WHERE message_id = ?"
    )
      .bind(data.id, id)
      .run()
    console.info(`Notification sent: ${data.id}`)
    return
  }
  const retryable =
    !error?.statusCode ||
    error.statusCode === 429 ||
    error.statusCode >= 500 ||
    error.name === 'concurrent_idempotent_requests'
  const retryAfter = Number(headers?.['retry-after'])
  const delay = Math.max(
    Math.min(60 * 2 ** Math.min(claimed.attempts - 1, 6), 3600),
    Number.isFinite(retryAfter) ? retryAfter : 0
  )
  await env.DB.prepare(
    'UPDATE notifications SET state = ?, next_attempt_at = ?, lease_until = 0, last_error = ? WHERE message_id = ?'
  )
    .bind(retryable ? 'pending' : 'failed', now + delay, error?.name ?? 'missing_email_id', id)
    .run()
}

export async function flushNotifications(env: NotificationEnv) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_TO || !env.RESEND_TEMPLATE_ID || !env.APP_ENV) return
  const now = Math.floor(Date.now() / 1000)
  const { results } = await env.DB.prepare(
    "SELECT message_id FROM notifications WHERE state = 'pending' AND next_attempt_at <= ? AND lease_until <= ? ORDER BY rowid LIMIT 10"
  )
    .bind(now, now)
    .all<{ message_id: string }>()
  for (const row of results) await deliverNotification(env, row.message_id)
}
