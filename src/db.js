const { createClient } = require('@libsql/client');

async function initDB() {
    const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    // Create tables
    await db.execute(`
        CREATE TABLE IF NOT EXISTS students (
            rfid_uid TEXT PRIMARY KEY,
            name TEXT,
            class TEXT
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS attendance_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rfid_uid TEXT,
            device_id TEXT,
            date TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS monthly_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rfid_uid TEXT,
            month_year TEXT,
            total_attendance INTEGER,
            UNIQUE(rfid_uid, month_year)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS devices (
            device_id TEXT PRIMARY KEY,
            display_text TEXT DEFAULT 'Selamat Datang!',
            mode TEXT DEFAULT 'READER',
            power_status INTEGER DEFAULT 1,
            last_scanned_uid TEXT,
            last_seen DATETIME
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS device_activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT,
            activity TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    return db;
}

module.exports = { initDB };