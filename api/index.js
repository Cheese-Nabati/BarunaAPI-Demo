const Fastify = require('fastify');
const { initializeApp } = require('../src/app_init');

let fastify;

async function buildApp() {
    const app = Fastify({
        logger: true,
        routerOptions: {
            ignoreTrailingSlash: true
        }
    });

    await initializeApp(app);
    await app.ready();

    return app;
}

module.exports = async (req, res) => {
    console.log('[RAW] method:', req.method);
    console.log('[RAW] url:', req.url);
    console.log('[RAW] content-type:', req.headers['content-type']);

    if (!fastify) {
        fastify = await buildApp();
    }

    fastify.server.emit('request', req, res);
};