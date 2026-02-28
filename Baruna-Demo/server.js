const path = require('path');
const fastify = require('fastify')({ logger: true });
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const fs = require('fs');

const PORT = process.env.PORT || 3000;
const DEVICE_API_KEY = "DEMO_SECURE_TOKEN_2026";

async function main() {
    // Ensure Database directory exists
    const dbDir = path.join(__dirname, 'Database');
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = await open({
        filename: './Database/demo_database.db',
        driver: sqlite3.Database
    });

    // Initialize Schema
    await db.exec(`
        CREATE TABLE IF NOT EXISTS students (rfid_uid TEXT PRIMARY KEY, name TEXT, class TEXT);
        CREATE TABLE IF NOT EXISTS attendance_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            rfid_uid TEXT, 
            device_id TEXT, 
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Add some sample demo data
        INSERT OR IGNORE INTO students (rfid_uid, name, class) VALUES ('12345678', 'Demo Student 1', 'X - IPA 1');
        INSERT OR IGNORE INTO students (rfid_uid, name, class) VALUES ('87654321', 'Demo Student 2', 'XI - IPS 2');
    `);

    // Register Static Files
    fastify.register(require('@fastify/formbody'));
    fastify.register(require('@fastify/static'), {
        root: path.join(__dirname, 'public'),
        index: 'index.html'
    });

    // API: Hardware Support (for real ESP32)
    fastify.post('/api/absen', async (request, reply) => {
        const { rfid_uid, device_id } = request.body;
        const token = request.headers['x-device-token'];

        if (token !== DEVICE_API_KEY) {
            return reply.status(403).send({ success: false, message: "Invalid Token" });
        }

        try {
            const student = await db.get('SELECT name FROM students WHERE rfid_uid = ?', [rfid_uid]);
            if (!student) return reply.status(404).send({ success: false, message: "Bukan Siswa" });

            await db.run('INSERT INTO attendance_logs (rfid_uid, device_id) VALUES (?, ?)', [rfid_uid, device_id]);
            return { success: true, name: student.name };
        } catch (err) {
            return reply.status(500).send({ success: false, error: err.message });
        }
    });

    // API: Fetch Logs (for Dashboard)
    fastify.get('/api/logs', async () => {
        return await db.all(`
            SELECT 
                attendance_logs.id,
                datetime(attendance_logs.timestamp, 'localtime') AS timestamp,
                students.name, 
                students.class 
            FROM attendance_logs 
            LEFT JOIN students ON attendance_logs.rfid_uid = students.rfid_uid 
            ORDER BY attendance_logs.timestamp DESC LIMIT 10
        `);
    });

    try {
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`Demo Server running at http://localhost:${PORT}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
