const bcrypt = require ('bcrypt');
const pool = require ('../db');

async function crearAdmin () {
    try {
        const email = 'juandca2004@gmail.com';
        const password = '12Juandavid12';
        const hash = await bcrypt.hash (password, 10);

        await pool.query (
            `INSERT INTO admins (
                email, 
                password, 
                rol
            )
            
            VALUES ($1, $2, $3)`,
            [
                email, 
                hash, 
                'superadmin'
            ]
        );

        console.log ('Administrador creado correctamente ✔️');

    } catch (error) {
        console.error (error);

    } finally {
        pool.end ();
    }
}

crearAdmin();