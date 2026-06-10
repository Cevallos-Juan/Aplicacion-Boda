const express = require ('express');
const router = express.Router ();
const { obtenerStats } = require ('../controllers/dashboard.controller');
const { verificarToken } = require ('../middleware/auth.middleware');

router.get ('/', verificarToken, obtenerStats);

module.exports = router;