const path = require('path');
require('dotenv').config();
const { initDB } = require('./db');

async function initializeApp(fastify) {
    const db = await initDB();
    fastify.decorate('db', db);

    // Using @fastify/secure-session for Vercel/Serverless
    // It's stateless (encrypted in the cookie), so it works reliably on Vercel
    fastify.register(require('@fastify/secure-session'), {
        // In production, set SESSION_SECRET as a long random string (32+ chars)
        secret: process.env.SESSION_SECRET || 'BARUNA_SECURE_DEMO_2026_VERY_LONG_STRING_32_CHARS_MIN',
        salt: 'mq9H98p7987987P98798QwertYuiop', // 16 chars salt
        cookie: {
            path: '/',
            httpOnly: true, // Security: Prevent JS access
            secure: process.env.NODE_ENV === 'production', // Use HTTPS in prod
            sameSite: 'lax',
            maxAge: 86400 // 24 hours in seconds
        }
    });

    fastify.addHook('preHandler', async (request, reply) => {
        const { url } = request;
        let cleanUrl = url.split('?')[0];
        
        if (cleanUrl.length > 1 && cleanUrl.endsWith('/')) {
            cleanUrl = cleanUrl.slice(0, -1);
        }

        if (cleanUrl === '/login' || cleanUrl === '/api/login' || cleanUrl.startsWith('/properties')) return;

        // Check session (secure-session uses request.session.get/set)
        const isAuthenticated = request.session && request.session.get('authenticated');

        const hardwareEndpoints = ['/api/absen', '/api/students', '/api/device/ping', '/api/device/report-scan', '/api/device/log'];
        const isHardwareApi = hardwareEndpoints.includes(cleanUrl);
        
        if (isHardwareApi) {
            if (isAuthenticated) return;
            
            const token = request.headers['x-device-token'];
            const expectedToken = process.env.DEVICE_API_KEY || 'BARUNA_SECURE_TOKEN_2026';
            
            if (token === expectedToken) return;
            
            console.log(`[AUTH] Rejected Device. Received Token: ${token}, Expected: ${expectedToken}`);
            return reply.status(403).send({ success: false, message: "Invalid Device Token" });
        }

        const protectedRoutes = ['/', '/dashboard', '/settings', '/student-view', '/recap-view', '/students-view', '/api'];
        const isProtected = protectedRoutes.some(p => cleanUrl === p || cleanUrl.startsWith(p + '/'));

        if (isProtected && !isAuthenticated) {
            console.log(`[AUTH] Unauthorized access attempt to: ${cleanUrl}. Redirecting to /login`);
            if (cleanUrl.startsWith('/api')) {
                return reply.status(401).send({ success: false, message: "Unauthorized Session" });
            }
            return reply.redirect('/login');
        }
    });

    fastify.register(require('@fastify/formbody'));
    fastify.register(require('@fastify/static'), {
        root: path.join(__dirname, '..', 'public'),
        index: false
    });

    fastify.register(require('./routes/getroutes'));
    fastify.register(require('./routes/postroutes'));

    return fastify;
}

module.exports = { initializeApp };
