const pool = require('../db');

const obtenerStats = async (req, res) => {
  try {
    const admin_id = req.admin.id;

    const stats = await pool.query (
      `SELECT 
        COUNT(*) AS total_invitados,
        COUNT(*) FILTER (WHERE estado = 'confirmado') AS confirmados,
        COUNT(*) FILTER (WHERE estado = 'rechazado') AS rechazados,
        COUNT(*) FILTER (
          WHERE estado = 'pendiente' OR estado IS NULL
        ) AS pendientes,

        COALESCE (SUM (invitados_permitidos), 0) AS personas_totales

      FROM invitados
      WHERE admin_id = $1`, [admin_id]);

    res.json (stats.rows [0]);

  } catch (error) {
    console.error (error);
    res.status (500).json ({
      message: 'Error al obtener las estadísticas ❌'
    });
  }
};

module.exports = { obtenerStats };