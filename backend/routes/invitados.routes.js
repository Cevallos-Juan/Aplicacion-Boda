const express = require ('express');
const router = express.Router ();
const invitadosController = require ('../controllers/invitados.controller');
const { verificarToken } = require ('../middleware/auth.middleware');

router.post ('/', verificarToken, invitadosController.crearInvitado);
router.put ('/confirmar', invitadosController.confirmarAsistencia);
router.put ('/:codigo', verificarToken, invitadosController.actualizarInvitado);
router.get ('/:codigo', invitadosController.obtenerInvitado);
router.get ('/', verificarToken, invitadosController.listarInvitados);
router.delete ('/:codigo', verificarToken, invitadosController.eliminarInvitado);

module.exports = router;