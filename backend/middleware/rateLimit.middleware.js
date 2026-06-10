const rateLimit = require ('express-rate-limit');

const loginLimiter = rateLimit ({
  windowMs: 30 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Has hecho muchos intentos de inicio de sesión. Intentalo más tarde.' }
});

module.exports = loginLimiter;