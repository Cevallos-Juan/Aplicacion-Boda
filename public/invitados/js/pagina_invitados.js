const API_URL = "";

let invitadoData = null;
let eventoData = null;
let codigo_unico;

// 🔹 Helper seguro
function setText(id, valor) {
    const el = document.getElementById(id);
    if (el) el.innerText = valor || "";
}

// 🚀 INIT
async function cargarDatos() {
    const codigo = localStorage.getItem("codigo_invitado");

    console.log("Código desde localStorage:", codigo);

    if (!codigo) {
        mostrarError("Acceso no autorizado");
        return;
    }

    try {
        const res = await fetch(`/api/invitado/${codigo}`);

        if (!res.ok) {
            throw new Error("Respuesta inválida del servidor");
        }

        const data = await res.json();

        invitadoData = data;
        eventoData = data;

        renderizar();

    } catch (error) {
        console.error("ERROR:", error);
        mostrarError("Error al cargar datos");
    }
}

// 🎨 RENDER
function renderizar() {
    setText("permitidos", invitadoData?.invitados_permitidos);
    setText("nombre_invitado", invitadoData?.nombre ? `Para: ${invitadoData.nombre}` : "");

    // 🔢 INPUT CORREGIDO (🔥 AQUÍ EL FIX REAL)
    const input = document.getElementById("cantidad");
    const max = invitadoData?.invitados_permitidos || 1;

    const btnAbrir =
        document.getElementById(
            "btnAbrirInvitacion"
        );

    if (invitadoData?.estado === "confirmado") {

        btnAbrir.style.display =
            "inline-block";

    } else {

        btnAbrir.style.display =
            "none";
    }

    input.max = max;

    // 🔥 SI YA CONFIRMÓ → mostrar lo que eligió
    if (invitadoData?.confirmados > 0) {
        input.value = invitadoData.confirmados;
    } else {
        input.value = ""; // 👈 vacío (correcto)
    }

    input.addEventListener("input", () => {
        if (input.value > max) input.value = max;
        if (input.value < 1) input.value = 1;
    });

    // 🔒 ESTADO
    if (invitadoData?.estado === "confirmado") {
        bloquearUI("Ya confirmaste tu asistencia ✅");
    }

    if (invitadoData?.estado === "rechazado") {
        bloquearUI("Has indicado que no asistirás ❌");
    }
}

// 🔒 BLOQUEAR UI
function bloquearUI(mensaje) {

    document.getElementById("botones").style.display = "none";
    document.getElementById("cantidad").disabled = true;
    document.getElementById("motivo_container").style.display = "none";

    const estado =
        document.getElementById("estado_confirmacion");

    estado.style.display = "block";
    estado.innerText = mensaje;
}

// ❌ ERROR
function mostrarError(msg) {
    document.body.innerHTML = `<h1 style="text-align:center;margin-top:50px;">${msg}</h1>`;
}

// 🧠 MOSTRAR MOTIVO
function confirmar(asiste) {

    const botones = document.getElementById("botones");
    const motivoContainer = document.getElementById("motivo_container");
    const textarea = document.getElementById("motivo");

    if (!asiste) {
        // 👇 Mostrar textarea limpio
        motivoContainer.style.display = "block";
        textarea.value = "";

        // 👇 Ocultar botones
        botones.style.display = "none";

        return;
    }

    enviarConfirmacion(true);
}

// ✅ ENVIAR CONFIRMACIÓN
async function enviarConfirmacion(asiste) {
    const codigo = localStorage.getItem("codigo_invitado");

    let cantidad = 0;
    let motivo = null;
    let estado = "confirmado";

    if (asiste) {
        cantidad = document.getElementById("cantidad").value || 0;

        if (cantidad <= 0) {
            alert("Por favor indica cuántas personas asistirán");
            return;
        }

    } else {
        motivo = document.getElementById("motivo").value.trim();

        if (!motivo) {
            alert("Por favor escribe un motivo");
            return;
        }

        estado = "rechazado";
    }

    try {
        const res = await fetch(`/confirmar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                codigo_unico: codigo,
                confirmados: cantidad,
                estado: estado,
                motivo: motivo
            })
        });

        if (!res.ok) {
            throw new Error("Error en confirmación");
        }

        // 🔥 ACTUALIZAR ESTADO LOCAL (SIN RECARGAR)
        invitadoData.estado = estado;
        invitadoData.confirmados = cantidad;

        // 🔥 REFRESCAR UI
        renderizar();

        // 🔥 MENSAJE BONITO
        if (estado === "confirmado") {
            bloquearUI(`Confirmaste ${cantidad} invitado(s) 💍`);
        } else {
            bloquearUI("Has indicado que no asistirás ❌");
        }

    } catch (error) {
        console.error(error);
        alert("Error al confirmar");
    }
}

// 🎬 ANIMACIONES TIPO APPLE
function animacionesScroll() {
    const elementos = document.querySelectorAll(".fade-in");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, {
        threshold: 0.15
    });

    elementos.forEach(el => observer.observe(el));
}

async function abrirInvitacion() {

    const codigo =
        localStorage.getItem("codigo_invitado");

    try {

        const res =
            await fetch(`/api/invitado/${codigo}`);

        const invitado =
            await res.json();

        if (invitado.estado === "rechazado") {

            alert(
                "Gracias por informarnos que no podrás acompañarnos."
            );

            return;
        }

        if (invitado.estado !== "confirmado") {

            alert(
                "Debes confirmar tu asistencia antes de abrir la invitación."
            );

            return;
        }

        setTimeout(() => {
            window.location.href =
                "https://nuestrabodadavidymichelle.my.canva.site/";
        }, 2500);

    } catch (error) {

        console.error(error);

        alert("Error al verificar la información.");
    }
}

/* =========================
   CARRUSEL SUAVE PREMIUM
========================= */

const imagenes = [
    "/invitados/img/Nosotros_1.jpeg",
    "/invitados/img/Nosotros_3.jpeg",
    "/invitados/img/Nosotros_2.jpeg",
    "/invitados/img/Nosotros_4.jpeg",
    "/invitados/img/Nosotros_5.jpeg"
];

const track = document.querySelector(".carousel-track");

let posicionActual = 0;

/* CREAR ITEM */
function crearItem(src) {

    const div = document.createElement("div");

    div.className = "carousel-item";

    div.innerHTML = `<img src="${src}">`;

    return div;
}

/* GENERAR ITEMS */
imagenes.forEach(src => {
    track.appendChild(crearItem(src));
});

/* CENTRO INICIAL */
actualizarCentro();

/* FUNCIÓN CENTRO */
function actualizarCentro() {

    const items = document.querySelectorAll(".carousel-item");

    items.forEach(el => el.classList.remove("center"));

    if (items[3]) {
        items[3].classList.add("center");
    }
}

/* MOVER */
function moverCarrusel() {

    const itemWidth = 355;

    track.style.transition =
        "transform 1.4s cubic-bezier(0.77, 0, 0.175, 1)";

    track.style.transform =
        `translateX(-${itemWidth + 35}px)`;

    setTimeout(() => {

        track.style.transition = "none";

        const primerItem = track.firstElementChild;

        track.appendChild(primerItem);

        track.style.transform = "translateX(0)";

        actualizarCentro();

        requestAnimationFrame(() => {

            requestAnimationFrame(() => {

                track.style.transition =
                    "transform 1.4s cubic-bezier(0.77, 0, 0.175, 1)";
            });
        });

    }, 1400);
}

/* AUTO */
setInterval(moverCarrusel, 4500);

window.addEventListener("load", animacionesScroll);

// 🚀 INICIAR ANIMACIONES
window.addEventListener("load", animacionesScroll);

/* =========================
   POLVO DORADO
========================= */

const goldContainer =
    document.querySelector(".gold-particles");

for (let i = 0; i < 50; i++) {

    const particle =
        document.createElement("div");

    particle.classList.add("gold-particle");

    // tamaño aleatorio
    const size = Math.random() * 8 + 4;

    particle.style.width = size + "px";
    particle.style.height = size + "px";

    // posición horizontal
    particle.style.left =
        Math.random() * 100 + "%";

    // duración distinta
    particle.style.animationDuration =
        (Math.random() * 12 + 10) + "s";

    // delay aleatorio
    particle.style.animationDelay =
        (Math.random() * 8) + "s";

    // opacidad distinta
    particle.style.opacity =
        Math.random() * 0.5;

    goldContainer.appendChild(particle);
}

// 🚀 START
cargarDatos();