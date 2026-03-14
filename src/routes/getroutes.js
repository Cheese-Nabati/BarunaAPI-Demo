const { WIB_MODIFIER, getWIBISOString, getWIBDateString } = require('../utils/time');

async function getRoutes(fastify, options) {
    const db = fastify.db;

    fastify.get('/', async (request, reply) => {
        return reply.redirect('/dashboard');
    });

    fastify.get('/api/device/ping', async (request, reply) => {
        const deviceId = request.headers['x-device-id'] || 'UNKNOWN_DEVICE';
        
        try {
            await db.execute({
                sql: `INSERT INTO devices (device_id, last_seen) 
                      VALUES (?, CURRENT_TIMESTAMP)
                      ON CONFLICT(device_id) DO UPDATE SET last_seen = CURRENT_TIMESTAMP`,
                args: [deviceId]
            });

            const result = await db.execute({
                sql: `SELECT mode, power_status, display_text FROM devices WHERE device_id = ?`,
                args: [deviceId]
            });
            const device = result.rows[0];

            return { 
                status: "ONLINE", 
                server_time: getWIBISOString(),
                mode: device ? device.mode : 'READER',
                power_status: device ? device.power_status : 1,
                display_text: device ? device.display_text : 'Selamat Datang!'
            };
        } catch (err) {
            return { status: "ONLINE", server_time: getWIBISOString(), mode: 'READER', power_status: 1 };
        }
    });

    fastify.get('/login', async (request, reply) => {
        console.log('[DEBUG] Body:', request.body);
        console.log('[DEBUG] Content-Type:', request.headers['content-type']);
        console.log('[DEBUG] expectedUser:', process.env.ADMIN_USERNAME || 'admin');
        console.log('[DEBUG] expectedPass:', process.env.ADMIN_PASSWORD || 'admin123');
        if (request.session.get('authenticated')) return reply.redirect('/dashboard');
        return reply.sendFile('login.html');
    });

    fastify.get('/logout', async (request, reply) => {
        request.session.delete();
        return reply.redirect('/login');
    });

    fastify.get('/dashboard', async (request, reply) => {
        return reply.sendFile('index.html');
    });

    fastify.get('/recap-view', async (request, reply) => {
        return reply.sendFile('recap.html');
    });

    fastify.get('/student-view', async (request, reply) => {
        return reply.sendFile('student-view.html');
    });

    fastify.get('/settings', async (request, reply) => {
        return reply.sendFile('settings.html');
    });

    fastify.get('/api/students', async () => {
        const { rows } = await db.execute('SELECT * FROM students ORDER BY name ASC');
        return rows;
    });

    fastify.get('/api/logs', async () => {
        const { rows } = await db.execute(`
            SELECT 
                attendance_logs.id,
                datetime(attendance_logs.timestamp, '${WIB_MODIFIER}') AS timestamp, 
                students.name, 
                students.class,
                attendance_logs.device_id
            FROM attendance_logs 
            LEFT JOIN students ON attendance_logs.rfid_uid = students.rfid_uid 
            ORDER BY attendance_logs.timestamp DESC LIMIT 20
        `);
        return rows;
    });

    fastify.get('/api/admin/device-activities', async (request, reply) => {
        const { rows } = await db.execute(`
            SELECT id, device_id, activity, datetime(timestamp, '${WIB_MODIFIER}') as timestamp 
            FROM device_activities 
            ORDER BY timestamp DESC LIMIT 50
        `);
        return rows;
    });

    fastify.get('/api/recap', async () => {
        const { rows } = await db.execute(`
            SELECT monthly_results.*, students.name, students.class 
            FROM monthly_results 
            JOIN students ON monthly_results.rfid_uid = students.rfid_uid 
            ORDER BY month_year DESC, students.name ASC
        `);
        return rows;
    });

    fastify.get('/api/admin/recap-bulanan', async (request, reply) => {
        try {
            const currentMonth = getWIBDateString().slice(0, 7);
            
            await db.execute({
                sql: `INSERT INTO monthly_results (rfid_uid, month_year, total_attendance)
                      SELECT rfid_uid, ?, COUNT(*) 
                      FROM attendance_logs 
                      WHERE strftime('%Y-%m', timestamp) = ?
                      GROUP BY rfid_uid
                      ON CONFLICT(rfid_uid, month_year) DO UPDATE SET total_attendance = excluded.total_attendance`,
                args: [currentMonth, currentMonth]
            });

            return { success: true, month: currentMonth };
        } catch (err) {
            return reply.status(500).send({ success: false, error: err.message });
        }
    });

    fastify.get('/api/recap/csv', async (request, reply) => {
        try {
            const { rows } = await db.execute(`
                SELECT monthly_results.month_year, monthly_results.rfid_uid, students.name, students.class, monthly_results.total_attendance 
                FROM monthly_results 
                JOIN students ON monthly_results.rfid_uid = students.rfid_uid 
                ORDER BY month_year DESC
            `);

            if (rows.length === 0) return reply.status(404).send("Belum ada data rekap untuk di-export.");

            let csvContent = "\ufeff";
            csvContent += "Bulan;RFID UID;Nama;Kelas;Total Hadir\n";

            rows.forEach(row => {
                csvContent += `${row.month_year};${row.rfid_uid};${row.name};${row.class};${row.total_attendance}\n`;
            });

            reply
                .header('Content-Type', 'text/csv; charset=utf-8')
                .header('Content-Disposition', 'attachment; filename=RekapBulanan.csv')
                .send(csvContent);
        } catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });

    fastify.get('/api/students/export-nfc', async (request, reply) => {
        try {
            const { rows: students } = await db.execute("SELECT rfid_uid, name, class FROM students");
            
            const exportData = {
                description: "Exported Student UIDs for NFC Emulation",
                generated_at: getWIBISOString(),
                students: students.map(s => ({
                    uid: s.rfid_uid,
                    name: s.name,
                    class_info: s.class,
                    uid_hex: s.rfid_uid.replace(/[^0-9A-Fa-f]/g, '').toUpperCase()
                }))
            };

            return reply
                .header('Content-Type', 'application/json')
                .header('Content-Disposition', 'attachment; filename=students_nfc_export.json')
                .send(JSON.stringify(exportData, null, 2));

        } catch (err) {
            return reply.status(500).send({ success: false, error: err.message });
        }
    });

    
}

module.exports = getRoutes;