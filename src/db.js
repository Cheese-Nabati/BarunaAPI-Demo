const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

async function initDB() {
    // On Vercel, the filesystem is read-only except for /tmp
    // We'll use /tmp/baruna_absensi.db if we are in a serverless environment
    const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
    const dbPath = isVercel 
        ? path.join('/tmp', 'baruna_absensi.db')
        : path.join(__dirname, '..', 'Database', 'baruna_absensi.db');

    // Ensure the directory exists (for local development)
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS students (rfid_uid TEXT PRIMARY KEY, name TEXT, class TEXT);
        CREATE TABLE IF NOT EXISTS attendance_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            rfid_uid TEXT, 
            device_id TEXT, 
            date TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS monthly_results (id INTEGER PRIMARY KEY AUTOINCREMENT, rfid_uid TEXT, month_year TEXT, total_attendance INTEGER, UNIQUE(rfid_uid, month_year));
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS devices (
            device_id TEXT PRIMARY KEY,
            display_text TEXT DEFAULT 'Selamat Datang!',
            mode TEXT DEFAULT 'READER',
            power_status INTEGER DEFAULT 1,
            last_scanned_uid TEXT,
            last_seen DATETIME
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS device_activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT,
            activity TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Migrations / Alter tables
    try { await db.exec(`ALTER TABLE devices ADD COLUMN display_text TEXT DEFAULT 'Selamat Datang!'`); } catch (e) {}
    try { await db.exec(`ALTER TABLE devices ADD COLUMN mode TEXT DEFAULT 'READER'`); } catch (e) {}
    try { await db.exec(`ALTER TABLE devices ADD COLUMN power_status INTEGER DEFAULT 1`); } catch (e) {}
    try { await db.exec(`ALTER TABLE devices ADD COLUMN last_scanned_uid TEXT`); } catch (e) {}
    try { await db.exec(`ALTER TABLE attendance_logs ADD COLUMN date TEXT`); } catch (e) {}

    return db;
}

module.exports = { initDB };
