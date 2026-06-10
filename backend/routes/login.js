const express = require ('express');
const router = express.Router ();
const bcrypt = require ('bcrypt');
const jwt = require ('jsonwebtoken');
const pool = require ('../db');
const loginLimiter = require ('../middleware/rateLimit.middleware');

router.post ('/', loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query ('SELECT * FROM admins WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status (404).json ({ message: 'El usuario ingresado no fue encontrado ❌' });
        }

        const usuario = result.rows [0];
        const isMatch = await bcrypt.compare (password, usuario.password);
        
        if (!isMatch) { 
            return res.status (401).json ({ message: 'La contraseña ingresada es incorrecta ❌' });
        }

        const token = jwt.sign (
        { id: usuario.id, email: usuario.email },

        process.env.JWT_SECRET,
        { expiresIn: '4h' }
        );

        res.json ({ message: 'Inicio de sesión exitoso 🔐​✔️', token, user: { id: usuario.id, email: usuario.email } });

    } catch (error) {
      console.error (error);
      res.status (500).json ({ message: 'Error en el inicio de sesión en el servidor 🔐​❌' });
    }
});

module.exports = router;