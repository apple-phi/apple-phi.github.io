CREATE TABLE notifications (
  message_id TEXT PRIMARY KEY REFERENCES messages(id),
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  first_attempt_at INTEGER,
  next_attempt_at INTEGER NOT NULL DEFAULT 0,
  lease_until INTEGER NOT NULL DEFAULT 0,
  email_id TEXT,
  last_error TEXT,
  sent_at TEXT
);

CREATE INDEX notifications_pending ON notifications(state, next_attempt_at);

CREATE TRIGGER notify_new_message AFTER INSERT ON messages
WHEN NEW.sender = 'visitor'
BEGIN
  INSERT INTO notifications (message_id) VALUES (NEW.id);
END;
