ALTER TABLE conversations ADD COLUMN name TEXT;
ALTER TABLE conversations ADD COLUMN question_index INTEGER NOT NULL DEFAULT 0;
UPDATE conversations SET name = 'Agent-' || substr(token, 1, 12);
CREATE UNIQUE INDEX conversations_name ON conversations(name COLLATE NOCASE);

ALTER TABLE messages ADD COLUMN recipient TEXT NOT NULL DEFAULT 'researcher';

CREATE TABLE presentations (
  id TEXT PRIMARY KEY,
  thread TEXT REFERENCES conversations(token),
  path TEXT NOT NULL,
  shown_at TEXT NOT NULL,
  agents INTEGER NOT NULL,
  question_index INTEGER NOT NULL,
  minutes INTEGER NOT NULL
);
