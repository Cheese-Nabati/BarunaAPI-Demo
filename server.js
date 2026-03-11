const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const fastify = require('fastify')({ logger: true });
const { initializeApp } = require('./src/app_init');

async function main() {
    await initializeApp(fastify);

    try {
        const port = process.env.PORT || 3000;
        await fastify.listen({ port: parseInt(port), host: '0.0.0.0' });
        console.log(`Server Middleman Aktif di Port ${port}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
