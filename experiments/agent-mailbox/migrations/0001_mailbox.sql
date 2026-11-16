CREATE TABLE conversations (
  token TEXT PRIMARY KEY,
  opening_id TEXT NOT NULL UNIQUE,
  recipient TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE messages (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  thread TEXT NOT NULL REFERENCES conversations(token),
  sender TEXT NOT NULL CHECK (sender IN ('visitor', 'researcher')),
  text TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 4000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX messages_thread_sequence ON messages(thread, sequence);
