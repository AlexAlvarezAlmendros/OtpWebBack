const { expressjwt: jwt } = require('express-jwt');
const jwks = require('jwks-rsa');

// Log de variables de entorno
console.log('🔐 Auth0 config:');
console.log('  - Domain:', process.env.AUTH0_DOMAIN);
console.log('  - Audience:', process.env.AUTH0_AUDIENCE);
console.log('  - JWKS URI:', `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`);

const checkJwt = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
  onExpired: (req, res, err) => {
    console.log('❌ Token expired:', err.message);
  }
});

// Middleware para logging
const logJwtResult = (req, res, next) => {
  console.log('🔐 JWT middleware result:');
  console.log('✅ User authenticated:', !!req.user);
  if (req.user) {
    console.log('👤 User sub:', req.user.sub);
    console.log('📧 User email:', req.user.email);
    console.log('🔑 Token content keys:', Object.keys(req.user));
  }
  next();
};

module.exports = { checkJwt, logJwtResult };
