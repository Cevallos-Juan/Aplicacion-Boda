const pool = require ('../db');
const bcrypt = require ('bcrypt');
const jwt = require ('jsonwebtoken');

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status (400).json ({ message: 'Por favor, ingresa tu email y contraseña ❌' });
    }

    const result = await pool.query ( 
      'SELECT * FROM admins WHERE email = $1', [email] 
    );

    if (result.rows.length === 0) { 
      return res.status (400).json ({ message: 'El email ingresado no es válido ❌​' }); 
    }

    const admin = result.rows [0];
    const passwordValido = await bcrypt.compare (password, admin.password);
    
    if (!passwordValido) { 
      return res.status (400).json ({ message: 'La contraseña ingresada no es válida ❌' }); 
    }

    const token = jwt.sign (
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json ({ message: 'Inicio de sesión exitoso 🔐​✔️​', token });

  } catch (error) {
    console.error (error);
    res.status (500).json ({ message: 'Error en el inicio de sesión 🔐​❌' });
  }
};

module.exports = { loginAdmin };