const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo SQLite loads its WebAssembly database engine in the browser.
config.resolver.assetExts.push('wasm');
config.server.enhanceMiddleware = middleware => (req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  return middleware(req, res, next);
};

module.exports = config;
