// URL base del backend
const API_URL = "";

// Bloqueo del sistema después del número máximo de intentos fallidos
const MAX_INTENTOS = 5;

// Tiempo de bloqueo (30 minutos)
const TIEMPO_BLOQUEO = 30 * 60 * 1000;

// Secuencia de intentos
let intentos = parseInt(localStorage.getItem("intentosLogin")) || 0;
let tiempoBloqueo = parseInt(localStorage.getItem("tiempoBloqueo")) || 0;

// 🔐 Verificar código
async function verificarCodigo() {
    const inputCodigo = document.getElementById("codigo");
    const mensaje = document.getElementById("mensaje");
    const boton = document.getElementById("btnVerificar");

    const codigo = inputCodigo.value.trim().toUpperCase();
    mensaje.innerText = "";

    const ahora = Date.now();

    // 🔒 Bloqueo activo
    if (tiempoBloqueo && ahora < tiempoBloqueo) {
        const tiempoRestante = Math.ceil((tiempoBloqueo - ahora) / 60000);
        mensaje.innerText = `Bloqueado. Intenta en ${tiempoRestante} minutos.`;
        boton.disabled = true;
        return;
    }

    // Reset bloqueo
    if (tiempoBloqueo && ahora >= tiempoBloqueo) {
        localStorage.removeItem("tiempoBloqueo");
        localStorage.removeItem("intentosLogin");
        intentos = 0;
        tiempoBloqueo = 0;
    }

    if (!codigo) {
        mensaje.innerText = "Ingresa tu código";
        return;
    }

    const formatoCodigo = /^BODA-[A-Z0-9]{6}$/;

    if (!formatoCodigo.test(codigo)) {
        mensaje.innerText = "Formato inválido (Ej: BODA-ABC123)";
        return;
    }

    try {
        mensaje.innerText = "Verificando...";
        boton.disabled = true;

        const respuesta = await fetch(`/api/invitados/${codigo}`);

        let data = null;
        try {
            data = await respuesta.json();
        } catch { }

        if (!respuesta.ok) {
            intentos++;
            localStorage.setItem("intentosLogin", intentos);

            if (intentos >= MAX_INTENTOS) {
                const bloqueo = Date.now() + TIEMPO_BLOQUEO;
                localStorage.setItem("tiempoBloqueo", bloqueo);
                mensaje.innerText = "Demasiados intentos. Intenta luego.";
                boton.disabled = true;
                return;
            }

            mensaje.innerText = data?.mensaje || "Código inválido";
            boton.disabled = false;
            return;
        }

        // ✅ GUARDAR SESIÓN
        localStorage.setItem("codigo_invitado", codigo);
        localStorage.setItem("invitado", JSON.stringify(data));

        console.log("Código guardado:", localStorage.getItem("codigo_invitado"));

        // Reset intentos
        localStorage.removeItem("intentosLogin");
        localStorage.removeItem("tiempoBloqueo");

        // 🚀 Redirigir
        window.location.href = "pagina_invitados.html";

    } catch (error) {
        console.error(error);
        mensaje.innerText = "Error de conexión";
        boton.disabled = false;
    }
}

// ENTER
document.getElementById("codigo").addEventListener("keypress", e => {
    if (e.key === "Enter") verificarCodigo();
});

// CLICK
document.getElementById("btnVerificar").addEventListener("click", verificarCodigo);

// Verificar bloqueo al cargar
window.addEventListener("load", () => {
    const mensaje = document.getElementById("mensaje");
    const boton = document.getElementById("btnVerificar");

    const tiempoBloqueo = parseInt(localStorage.getItem("tiempoBloqueo")) || 0;
    const ahora = Date.now();

    if (tiempoBloqueo && ahora < tiempoBloqueo) {
        const tiempoRestante = Math.ceil((tiempoBloqueo - ahora) / 60000);
        mensaje.innerText = `Bloqueado por intentos. ${tiempoRestante} min restantes`;
        boton.disabled = true;
    }
});