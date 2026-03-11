const path = require('path');
require('dotenv').config();
const { initDB } = require('./db');

async function initializeApp(fastify) {
    const db = await initDB();
    fastify.decorate('db', db);

    fastify.register(require('@fastify/cookie'));
    fastify.register(require('@fastify/session'), {
        secret: process.env.SESSION_SECRET || 'PLEASE_SET_A_SESSION_SECRET_IN_ENV',
        cookie: { secure: false }
    });

    fastify.addHook('preHandler', async (request, reply) => {
        const { url, method } = request;
        const cleanUrl = url.split('?')[0].replace(/\/$/, ""); // Normalize URL

        if (cleanUrl === '/login' || cleanUrl === '/api/login' || cleanUrl.startsWith('/properties')) return;

        // These endpoints allow EITHER a valid session OR a valid Device Token
        const hardwareEndpoints = ['/api/absen', '/api/students', '/api/device/ping', '/api/device/report-scan', '/api/device/log'];
        const isHardwareApi = hardwareEndpoints.includes(cleanUrl);
        
        if (isHardwareApi) {
            if (request.session.authenticated) return; // Allow if logged in via browser
            
            const token = request.headers['x-device-token'];
            const expectedToken = process.env.DEVICE_API_KEY || 'BARUNA_SECURE_TOKEN_2026';
            
            if (token === expectedToken) return; // Allow if valid hardware token
            
            console.log(`[AUTH] Rejected Device. Received Token: ${token}, Expected: ${expectedToken}`);
            return reply.status(403).send({ success: false, message: "Invalid Device Token" });
        }

        const protectedRoutes = ['/', '/dashboard', '/settings', '/student-view', '/recap-view', '/students-view', '/api'];
        const isProtected = protectedRoutes.some(p => cleanUrl === p || cleanUrl.startsWith(p + '/'));

        if (isProtected && !request.session.authenticated) {
            if (cleanUrl.startsWith('/api')) {
                return reply.status(401).send({ success: false, message: "Unauthorized Session" });
            }
            return reply.redirect('/login');
        }
    });

    fastify.register(require('@fastify/formbody'));
    fastify.register(require('@fastify/static'), {
        root: path.join(__dirname, '..', 'public'),
        index: false // Prevent automatic serving of index.html at root
    });

    fastify.register(require('./routes/getroutes'));
    fastify.register(require('./routes/postroutes'));

    return fastify;
}

module.exports = { initializeApp };
