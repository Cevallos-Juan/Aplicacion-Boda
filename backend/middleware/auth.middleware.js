const jwt = require ('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const authHeader = req.headers ['authorization'];

  if (!authHeader) {
    return res.status (401).json ({ message: 'El token de autenticación requerido no fue encontrado ❌' });
  }

  const token = authHeader.split (' ') [1];

  try {
    const decoded = jwt.verify (token, process.env.JWT_SECRET);
    req.admin = decoded;
    next ();

  } catch (error) {
    return res.status (401).json ({ message: 'El token de autenticación no es válido ❌' });
  }
};

module.exports = { verificarToken };