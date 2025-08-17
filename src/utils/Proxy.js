const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000', 
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', 
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.originalUrl} => ${proxyReq.path}`);
      },
      onError: (err, req, res) => {
        console.error('[PROXY ERROR]', err);
        res.status(500).json({ error: 'Proxy error' });
      }
    })
  );
};