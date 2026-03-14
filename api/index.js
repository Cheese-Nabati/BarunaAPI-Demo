const app = Fastify({
    logger: true,
    routerOptions: {
        ignoreTrailingSlash: true
    }
});

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