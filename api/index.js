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

module.exports = async (req, res) => {
    console.log('[RAW] method:', req.method);
    console.log('[RAW] url:', req.url);
    console.log('[RAW] headers:', JSON.stringify(req.headers));
    console.log('[RAW] body:', req.body);

    if (!fastify) {
        fastify = await buildApp();
    }

    fastify.server.emit('request', req, res);
};