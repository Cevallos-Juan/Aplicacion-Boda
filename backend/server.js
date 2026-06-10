require ('dotenv').config ();
const pool = require ('./db');
const express = require ('express');
const cors = require ('cors');

const app = express ();
const path = require ('path');

app.use (cors ());
app.use (express.json ());

app.post('/api/debug-login', (req, res) => {
  console.log('debug-login body', req.body);
  res.json({ ok: true, body: req.body });
});

// servir frontend
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/invitados/login_invitados.html'));
});

const invitadosRoutes = require ('./routes/invitados.routes');
app.use ('/api/invitados', invitadosRoutes);

const loginRoutes = require ('./routes/login');
app.use ('/api/login', loginRoutes);

const dashboardRoutes = require ('./routes/dashboard.routes');
app.use ('/api/dashboard', dashboardRoutes);

const eventosRoutes = require ('./routes/eventos.routes');
app.use ('/api/eventos', eventosRoutes);

const PORT = process.env.PORT || 3000;
app.listen (PORT, () => { console.log (`Servidor corriendo en el puerto http://localhost:${PORT}`); });

app.get ('/test-db', async (req, res) => {
  try {
    const result = await pool.query ('SELECT NOW ()');
    res.json ({ message: 'Conexión exitosa en la base de datos ✔️', fecha: result.rows [0] });

  } catch (error) {
    console.error (error);
    res.status (500).json ({ error: 'Error en la conexión con la base de datos ❌' });
  }
});

app.get ("/api/invitado/:codigo", async (req, res) => {
  try {
    const { codigo } = req.params;

    const result = await pool.query (
      `SELECT 
        i.id,
        i.nombre,
        i.invitados_permitidos,
        i.confirmados,
        i.estado,

        e.nombre_novio,
        e.nombre_novia,
        e.fecha,
        e.hora,
        e.lugar,
        e.direccion,
        e.link_maps,
        e.mensaje_bienvenida,
        e.dress_code,
        e.detalle_dress_code,
        e.info_regalos,
        e.cuenta_bancaria

      FROM invitados i
      JOIN eventos e ON i.evento_id = e.id
      WHERE i.codigo_unico = $1`, 
      [codigo]
    );

    if (result.rows.length === 0) {
      return res.status (404).json ({ error: "Invitado no encontrado" });
    }

    res.json (result.rows [0]);

  } catch (error) {
    console.error ("ERROR REAL:", error.message);
    res.status (500).json ({ error: "Error del servidor", detalle: error.message });
  }
});

app.post ("/confirmar", async (req, res) => {
  try {
    let { codigo_unico, confirmados, estado, motivo } = req.body;

    const invitado = await pool.query (
      'SELECT * FROM invitados WHERE codigo_unico = $1', [codigo_unico]
    );

    if (invitado.rows.length === 0) {
      return res.status (404).json ({ error: "Invitado no encontrado" });
    }

    const data = invitado.rows [0];

    let nuevosConfirmados = confirmados || 0;
    let fecha = new Date ();

    if (!estado) {
      if (confirmados > 0) {
        estado = "confirmado";

      } else { estado = "rechazado"; }
    }

    if (estado === "rechazado") {
      nuevosConfirmados = 0;
      fecha = new Date ();
    }

    if (estado === "pendiente") {
      nuevosConfirmados = 0;
      fecha = null;
    }

    if (estado === "confirmado") {
      if (confirmados > data.invitados_permitidos) {
        return res.status (400).json ({ error: "Excede el número permitido" });
      }
      fecha = new Date ();
    }

    await pool.query (
      `UPDATE invitados
      SET 
        confirmados = $1,
        estado = $2,
        fecha_confirmacion = $3,
        motivo = $4
      WHERE codigo_unico = $5`, 
      [
        nuevosConfirmados,
        estado,
        fecha,
        motivo || null,
        codigo_unico
      ]
    );

    res.json ({ mensaje: "Actualizado correctamente" });

  } catch (error) {
    console.error (error);
    res.status (500).json ({ error: "Error del servidor" });
  }
});

pool.connect ()
  .then (() => console.log ('Conectado a la base de datos ✔️'))
  .catch (err => console.error ('Ocurrio un problema al conectar a la base de datos ❌', err));