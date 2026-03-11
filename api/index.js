const fastify = require('fastify')({ logger: true });
const { initializeApp } = require('../src/app_init');

let initialized = false;

async function handler(request, reply) {
    if (!initialized) {
        await initializeApp(fastify);
        initialized = true;
    }
    await fastify.ready();
    fastify.server.emit('request', request, reply);
}

module.exports = handler;
