const Fastify = require('fastify');
const { initializeApp } = require('../src/app_init');

let fastify;

async function buildApp() {
  const app = Fastify({
    logger: true,
    ignoreTrailingSlash: true
  });

  await initializeApp(app);
  await app.ready();

  return app;
}

module.exports = async (req, res) => {
  if (!fastify) {
    fastify = await buildApp();
  }

  fastify.server.emit('request', req, res);
};