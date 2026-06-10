const express = require ('express');
const router = express.Router ();
const pool = require ('../db');
const { verificarToken } = require ('../middleware/auth.middleware');

router.get ('/', verificarToken, async (req, res) => {
  try {
    const result = await pool.query (
      `SELECT 
        id, 
        nombre_novio, 
        nombre_novia, 
        tipo_evento
      FROM eventos 
      WHERE admin_id = $1`,
      [req.admin.id]
    );

    res.json (result.rows);

  } catch (error) {
    console.error (error);
    res.status (500).json ({ error: "Error al obtener eventos" });
  }
});

module.exports = router;