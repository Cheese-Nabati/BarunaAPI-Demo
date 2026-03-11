const path = require('path');
require('dotenv').config();
const { initDB } = require('./db');

async function initializeApp(fastify) {
    const db = await initDB();
    fastify.decorate('db', db);

    fastify.register(require('@fastify/cookie'));
    fastify.register(require('@fastify/session'), {
        secret: process.env.SESSION_SECRET || 'BARUNA_DEMO_SECRET_KEY_2026_LONG_STRING',
        cookie: { 
            secure: false, // Set to false for demo ease, or auto-detect
            maxAge: 86400 * 1000, // 24 hours
            path: '/'
        },
        saveUninitialized: true // Ensure cookie is sent even if session is empty
    });

    fastify.addHook('preHandler', async (request, reply) => {
        const { url } = request;
        let cleanUrl = url.split('?')[0];
        
        // Remove trailing slash except for the root /
        if (cleanUrl.length > 1 && cleanUrl.endsWith('/')) {
            cleanUrl = cleanUrl.slice(0, -1);
        }

        // Public routes
        if (cleanUrl === '/login' || cleanUrl === '/api/login' || cleanUrl.startsWith('/properties')) return;

        // --- AUTHENTICATION LOGIC ---
        const isAuthenticated = request.session && request.session.authenticated;

        // Hardware Endpoints (Special Auth: Session OR Token)
        const hardwareEndpoints = ['/api/absen', '/api/students', '/api/device/ping', '/api/device/report-scan', '/api/device/log'];
        const isHardwareApi = hardwareEndpoints.includes(cleanUrl);
        
        if (isHardwareApi) {
            if (isAuthenticated) return; // Allow if logged in via browser
            
            const token = request.headers['x-device-token'];
            const expectedToken = process.env.DEVICE_API_KEY || 'BARUNA_SECURE_TOKEN_2026';
            
            if (token === expectedToken) return; // Allow if valid hardware token
            
            console.log(`[AUTH] Rejected Device. Received Token: ${token}, Expected: ${expectedToken}`);
            return reply.status(403).send({ success: false, message: "Invalid Device Token" });
        }

        // Protected UI Routes
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
        index: false // Prevent automatic serving of index.html at root
    });

    fastify.register(require('./routes/getroutes'));
    fastify.register(require('./routes/postroutes'));

    return fastify;
}

module.exports = { initializeApp };
