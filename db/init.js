const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let db = null;

function initDatabase() {
  return new Promise((resolve, reject) => {
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'supplements.db');
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        return reject(err);
      }

      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('Error enabling foreign keys:', err);
          return reject(err);
        }

        // Create supplements table
        db.run(`
          CREATE TABLE IF NOT EXISTS supplements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            default_dosage TEXT,
            button_color TEXT DEFAULT '#6c757d',
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('Error creating supplements table:', err);
            return reject(err);
          }

          // Create logs table
          db.run(`
            CREATE TABLE IF NOT EXISTS logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              supplement_id INTEGER NOT NULL,
              taken_at TIMESTAMP NOT NULL,
              dosage TEXT NOT NULL,
              notes TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (supplement_id) REFERENCES supplements(id) ON DELETE CASCADE
            )
          `, (err) => {
            if (err) {
              console.error('Error creating logs table:', err);
              return reject(err);
            }

            // Create indexes
            db.run('CREATE INDEX IF NOT EXISTS idx_logs_supplement_id ON logs(supplement_id)', (err) => {
              if (err) {
                console.error('Error creating index 1:', err);
                return reject(err);
              }

              db.run('CREATE INDEX IF NOT EXISTS idx_logs_taken_at ON logs(taken_at)', (err) => {
                if (err) {
                  console.error('Error creating index 2:', err);
                  return reject(err);
                }

                console.log('Database initialized at:', dbPath);
                resolve(db);
              });
            });
          });
        });
      });
    });
  });
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Promisified query methods
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  initDatabase,
  getDb,
  dbRun,
  dbGet,
  dbAll
};
