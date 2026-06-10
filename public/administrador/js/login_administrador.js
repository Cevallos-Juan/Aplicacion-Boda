const API_URL = "";

async function loginAdmin () {
    const emailInput = document.getElementById ("email");
    const passwordInput = document.getElementById ("password");
    const mensaje = document.getElementById ("mensaje");
    const boton = document.getElementById ("btnLogin");
    const email = emailInput.value.trim ();
    const password = passwordInput.value.trim ();

    mensaje.innerText = "";

    if (!email || !password) {
        mensaje.innerText = "Completa todos los campos";
        return;
    }

    try {
        mensaje.innerText = "Iniciando sesión...";
        boton.disabled = true;

        const res = await fetch (`/api/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify ({ email, password })
        });

        let data;

        try {
            data = await res.json ();
        } catch {
            throw new Error ("Respuesta inválida del servidor");
        }

        if (!res.ok) {
            mensaje.innerText = data.message || "Credenciales incorrectas";
            boton.disabled = false;
            return;
        }

        localStorage.setItem ("token", data.token);

        mensaje.innerText = "Ingreso exitoso ✔️";

        setTimeout (() => {
            window.location.href = "panel_control.html";
        }, 800);

    } catch (error) {
        console.error ("❌ Error login:", error);
        mensaje.innerText = "Error en el servidor";
        boton.disabled = false;
    }
}

document.addEventListener ("DOMContentLoaded", () => {

    const btn = document.getElementById ("btnLogin");
    const password = document.getElementById ("password");
    const email = document.getElementById ("email");

    btn.addEventListener ("click", loginAdmin);

    password.addEventListener ("keypress", (e) => {
        if (e.key === "Enter") loginAdmin ();
    });

    email.addEventListener ("keypress", (e) => {
        if (e.key === "Enter") loginAdmin ();
    });
});