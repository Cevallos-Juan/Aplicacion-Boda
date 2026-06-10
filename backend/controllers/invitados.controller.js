const pool = require ('../db');
const { customAlphabet } = require ('nanoid')
const nanoidCustom = customAlphabet ('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);
const { v4: uuidv4 } = require ('uuid');

const crearInvitado = async (req, res) => {
  try {
    const { nombre, telefono, invitados_permitidos, evento_id, estado, motivo } = req.body;
    const admin_id = req.admin.id;

    if (!nombre || nombre.trim () === '') {
      return res.status (400).json ({ message: '¡Ey!. El nombre es obligatorio ⚠️​' });
    }

    if (!invitados_permitidos || invitados_permitidos <= 0) {
      return res.status (400).json ({ message: '¡Ey!. Tienes que permitir al menos 1 invitado ⚠️​' });
    }

    const id = uuidv4 ();

    let codigo_unico;
    let codigoExiste = true;

    while (codigoExiste) {
      codigo_unico = 'BODA-' + nanoidCustom ();

      const verificar = await pool.query (
        'SELECT codigo_unico FROM invitados WHERE codigo_unico = $1 AND evento_id = $2', [codigo_unico, evento_id]
      );

      if (verificar.rows.length === 0) {
        codigoExiste = false;
      }
    }

    await pool.query (
      `INSERT INTO invitados (
        id, 
        admin_id, 
        evento_id, 
        nombre, telefono, 
        codigo_unico, 
        invitados_permitidos, 
        estado, 
        confirmados
      )

      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)`,
      [
        id, 
        admin_id, 
        evento_id, 
        nombre, telefono, 
        codigo_unico, 
        invitados_permitidos, 
        estado
      ]
    );

    res.json ({ message: 'El invitado fue creado correctamente ​​✔️​', codigo_unico });

  } catch (error) {
    console.error (error);
    res.status (500).json ({ error: 'Error al crear al invitado ❌' });
  }
};

const actualizarInvitado = async (req, res) => {
  try {
    const { codigo } = req.params;

    let {
      nombre,
      telefono,
      invitados_permitidos,
      confirmados,
      estado,
      fecha_confirmacion,
      motivo
    } = req.body;

    const admin_id = req.admin.id;

    if (!codigo) {
      return res.status (400).json ({ message: 'Código inválido ❌' });
    }

    if (estado === "rechazado") {
      confirmados = 0;
      fecha_confirmacion = new Date ();
    }

    if (estado === "pendiente") {
      confirmados = 0;
      fecha_confirmacion = null;
      motivo = null;
    }

    if (estado === "confirmado") {
      fecha_confirmacion = fecha_confirmacion || new Date ();
    }

    const result = await pool.query (
      `UPDATE invitados 
       SET nombre = $1,
           telefono = $2,
           invitados_permitidos = $3,
           confirmados = $4,
           estado = $5,
           fecha_confirmacion = $6,
           motivo = $7
       WHERE codigo_unico = $8 AND admin_id = $9
       RETURNING *`,
      [
        nombre,
        telefono,
        invitados_permitidos,
        confirmados,
        estado,
        fecha_confirmacion || null,
        motivo || null,
        codigo,
        admin_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status (404).json ({
        message: 'Invitado no encontrado ❌'
      });
    }

    res.json ({
      message: 'Invitado actualizado correctamente ✔️',
      invitado: result.rows [0]
    });

  } catch (error) {
    console.error ("ERROR UPDATE:", error);
    res.status (500).json ({ message: 'Error al actualizar invitado ❌' });
  }
};

const confirmarAsistencia = async (req, res) => {
  try {
    const { codigo_unico, confirmados } = req.body;

    if (!confirmados || confirmados <= 0) {
      return res.status (400).json ({ message: 'El número de invitados confirmados no es válido ⚠️' });
    }

    const invitado = await pool.query (
      'SELECT * FROM invitados WHERE codigo_unico = $1', [codigo_unico]
    );

    if (invitado.rows.length === 0) {
      return res.status (404).json ({ message: 'El invitado no fue encontrado ❌' });
    }

    const datos = invitado.rows [0];

    if (confirmados > datos.invitados_permitidos) {
      return res.status (400).json ({ message: `Solo puede confirmar ${datos.invitados_permitidos} personas` });
    }

    if (datos.estado === 'confirmado') {
      return res.status (400).json ({ message: 'Este invitado ya confirmó su asistencia anteriormente ❌' });
    }

    const result = await pool.query (
      `UPDATE invitados
      SET estado = 'confirmado',
          confirmados = $1,
          fecha_confirmacion = NOW ()
      WHERE codigo_unico = $2
      RETURNING 
        nombre, 
        codigo_unico, 
        invitados_permitidos, 
        confirmados, 
        estado, 
        fecha_confirmacion`, 
        [
          confirmados, 
          codigo_unico
        ]
    );

    res.json ({ message: 'La asistencia fue actualizada correctamente ✔️', invitado: result.rows [0] });

  } catch (error) {
    console.error (error);
    res.status (500).json ({ message: 'Error al confirmar la asistencia del invitado ❌' });
  }
};

const obtenerInvitado = async (req, res) => {
  try {
    const { codigo } = req.params;
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, '../invitado-debug.log');
    fs.appendFileSync(logFile, `${new Date().toISOString()} obtenerInvitado codigo: ${codigo}\n`);

    if (!codigo || codigo.trim () === '') {
      return res.status (400).json ({ message: 'El código ingresado no es válido ❌' });
    }

    const result = await pool.query(
      'SELECT id, nombre, codigo_unico, invitados_permitidos, confirmados, estado FROM invitados WHERE codigo_unico = $1', [codigo]
    );

    if (result.rows.length === 0) {
      return res.status (404).json ({ message: 'La invitación no fue encontrada ❌​' });
    }

    res.json (result.rows [0]);

  } catch (error) {
    console.error (error);
    res.status (500).json ({ error: 'Error al obtener al invitado ❌' });
  }
};

const eliminarInvitado = async (req, res) => {
  try {
    const { codigo } = req.params;

    if (!codigo || codigo.trim () === '') {
      return res.status (400).json ({ message: 'El código ingresado no es válido ❌' });
    }

    const admin_id = req.admin.id;
    const result = await pool.query (
      'DELETE FROM invitados WHERE codigo_unico = $1 AND admin_id = $2 RETURNING *', [codigo, admin_id]
    );

    if (result.rows.length === 0) {
      return res.status (404).json ({ message: 'El invitado ingresado no fue encontrado ❌' });
    }

    res.json ({ message: 'El invitado fue eliminado correctamente ✔️🗑️', invitado: result.rows [0] });

  } catch (error) {
    console.error (error);
    res.status (500).json ({ error: 'Error al eliminar al invitado ❌' });
  }
};

const listarInvitados = async (req, res) => {
  try {
    const admin_id = req.admin.id;
    const result = await pool.query (
      `SELECT 
        nombre,
        codigo_unico,
        telefono,
        invitados_permitidos,
        confirmados,
        estado,
        fecha_confirmacion,
        motivo
      FROM invitados
      WHERE admin_id = $1
      ORDER BY nombre ASC`,
      [admin_id]
    );

    return res.json (result.rows);

  } catch (error) {
    console.error (error);
    res.status (500).json ({ message: 'Error al obtener la lista de invitados ingresados ❌' });
  }
};

module.exports = {
  crearInvitado,
  actualizarInvitado,
  obtenerInvitado,
  confirmarAsistencia,
  eliminarInvitado,
  listarInvitados
};