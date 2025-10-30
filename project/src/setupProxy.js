const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    ['/project', '/api', '/files'], // 우리 백엔드가 쓰는 접두어들
    createProxyMiddleware({
      target: 'http://localhost:8080', 
      changeOrigin: true,
      logLevel: 'debug',
    })
  );
};