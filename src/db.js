const { Database } = require("bun:sqlite");
const db = new Database("readit.db", {
	strict: true,
});

function runMigration(name, migrationFn) {
	const exists = db
		.query("SELECT * FROM migrations WHERE name = $name")
		.get({ name });

	if (!exists) {
		migrationFn();
		db.query("INSERT INTO migrations (name) VALUES ($name)").run({ name });
	}
}

// users table
db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT
  )
`).run();

// subs table
db.query(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subreddit TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, subreddit)
  )
`).run();

// migrations table
db.query(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  )
`).run();

runMigration("add-isAdmin-column", () => {
	db.query(`
    ALTER TABLE users
    ADD COLUMN isAdmin INTEGER DEFAULT 0
  `).run();

	// first user is admin
	db.query(`
    UPDATE users
    SET isAdmin = 1
    WHERE id = (SELECT MIN(id) FROM users)
  `).run();
});

module.exports = { db };
