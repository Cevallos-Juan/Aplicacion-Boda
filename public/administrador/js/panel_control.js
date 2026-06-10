const API_URL = "";
const token = localStorage.getItem("token");

// =========================
// 🔐 PROTEGER PANEL
// =========================
if (!token) {
    window.location.href = "login_administrador.html";
}

// =========================
// 🔄 SECCIONES
// =========================
function mostrarSeccion(id) {
    document.querySelectorAll(".seccion").forEach(sec => {
        sec.classList.remove("active");
    });

    const section = document.getElementById(id);
    if (section) section.classList.add("active");

    if (id === "ver") cargarInvitados();
}

// =========================
// 🚪 LOGOUT
// =========================
function logout() {
    localStorage.removeItem("token");
    window.location.href = "login_administrador.html";
}

// =========================
// 📂 DROPDOWN (CORREGIDO)
// =========================
function toggleMenu(e) {
    e.stopPropagation();
    document.getElementById("submenuInvitados").classList.toggle("active");
}

function irSeccion(e, id) {
    e.stopPropagation();
    mostrarSeccion(id);
    cerrarMenu();
}

function cerrarMenu() {
    const menu = document.getElementById("submenuInvitados");
    if (menu) menu.classList.remove("active");
}

document.addEventListener("click", cerrarMenu);

// =========================
// 📊 DASHBOARD
// =========================
async function cargarDashboard() {
    try {
        const res = await fetch(`/api/dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Error dashboard");

        const data = await res.json();

        document.getElementById("total").innerText = parseInt(data.total_invitados) || 0;
        document.getElementById("confirmados").innerText = parseInt(data.confirmados) || 0;
        document.getElementById("rechazados").innerText = parseInt(data.rechazados) || 0;
        document.getElementById("pendientes").innerText = parseInt(data.pendientes) || 0;

    } catch (error) {
        console.error("❌ Dashboard:", error);
    }
}

// =========================
// 👥 LISTAR INVITADOS
// =========================
async function cargarInvitados() {
    try {
        const res = await fetch(`/api/invitados`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Error invitados");

        const data = await res.json();
        const contenedor = document.getElementById("tablaInvitados");

        if (!data.length) {
            contenedor.innerHTML = "<p>No hay invitados</p>";
            return;
        }

        let html = `
            <table class="tabla">
                <thead>
                    <tr>
                        <th>Nombres</th>
                        <th>Teléfono</th>
                        <th>Código</th>
                        <th>Permitidos</th>
                        <th>Confirmados</th>
                        <th>Estado</th>
                        <th>Fecha Confirmación</th>
                        <th>Motivo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(inv => {
            html += `
                <tr>
                    <td>${inv.nombre}</td>
                    <td>${inv.telefono || "-"}</td>
                    <td><strong>${inv.codigo_unico}</strong></td>
                    <td>${inv.invitados_permitidos}</td>
                    <td>${inv.confirmados}</td>
                    <td>${inv.estado}</td>
                    <td>${inv.fecha_confirmacion ? new Date(inv.fecha_confirmacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " • " + new Date(inv.fecha_confirmacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}</td>
                    <td>${inv.motivo || "-"}</td>

                    <td>
                        <button onclick="abrirModalEditar('${inv.codigo_unico}', '${inv.nombre}', '${inv.telefono}', '${inv.invitados_permitidos}', '${inv.confirmados}', '${inv.estado}', '${inv.fecha_confirmacion || ""}', '${(inv.motivo || "")}')">✏️</button>
                        <button onclick="abrirModalEliminar('${inv.codigo_unico}', '${inv.nombre}')">❌</button>
                    </td>
                </tr>
            `;
        });

        html += "</tbody></table>";
        contenedor.innerHTML = html;

    } catch (error) {
        console.error("❌ Invitados:", error);
    }
}

async function cargarEventos() {
    try {
        const res = await fetch(`/api/eventos`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        console.log("EVENTOS:", data); // 👈 ya viste que sí trae datos

        const selectEvento = document.getElementById("evento_id");

        if (!selectEvento) {
            console.error("❌ No existe #evento_id en el DOM");
            return;
        }

        const evento_id = selectEvento.value;

        selectEvento.innerHTML = `<option value="">Seleccionar evento</option>`;

        data.forEach(ev => {
            selectEvento.innerHTML += `
                <option value="${ev.id}">
                    ${ev.tipo_evento} - ${ev.nombre_novio} & ${ev.nombre_novia}
                </option>
            `;
        });

    } catch (error) {
        console.error("Error eventos:", error);
    }
}

// =========================
// 🪟 MODAL CREAR
// =========================
function abrirModalCrear() {
    document.getElementById("modalCrear").classList.add("active");
    cargarEventos();
}

function cerrarModalCrear() {
    document.getElementById("modalCrear").classList.remove("active");
}

// =========================
// ➕ CREAR INVITADO
// =========================
async function crearInvitado() {
    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const invitados_permitidos = document.getElementById("invitados_permitidos").value;
    const evento_id = document.getElementById("evento_id").value;
    const estado = document.getElementById("estado").value;

    const msg = document.getElementById("msgCrear");

    if (!nombre || !invitados_permitidos || !evento_id) {
        msg.innerText = "Completa los campos obligatorios";
        return;
    }

    try {
        const res = await fetch(`/api/invitados`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                nombre,
                telefono,
                invitados_permitidos: parseInt(invitados_permitidos),
                evento_id,
                estado
            })
        });

        const data = await res.json();

        mostrarModalSuccess(
            "Invitado creado ✔️",
            `El invitado fue creado correctamente`,
            data.codigo_unico
        );

        cerrarModalCrear();
        cargarInvitados();

        msg.innerText = "Invitado creado ✔️";

        cerrarModalCrear();
        mostrarSeccion("ver");
        await cargarInvitados();
        await cargarDashboard();


    } catch (error) {
        console.error(error);
        msg.innerText = "Error del servidor";
    }
}

// =========================
// 🪟 MODAL EDITAR (PRO)
// =========================
function abrirModalEditar(codigo, nombre, telefono, permitidos, confirmados, estado, fecha_confirmacion, motivo) {
    document.getElementById("edit_codigo").value = codigo;
    document.getElementById("edit_nombre").value = nombre || "";
    document.getElementById("edit_telefono").value = telefono || "";
    document.getElementById("edit_permitidos").value = permitidos || 1;
    document.getElementById("edit_confirmados").value = confirmados || 0;
    document.getElementById("edit_estado").value = estado || "pendiente";
    if (fecha_confirmacion) {
        const f = new Date(fecha_confirmacion);
        const iso = f.toISOString().slice(0, 16);
        document.getElementById("edit_fecha").value = iso;
    } else {
        document.getElementById("edit_fecha").value = "";
    }
    document.getElementById("edit_motivo").value = motivo || "";
    document.getElementById("modalEditar").classList.add("active");
}

function cerrarModalEditar() {
    document.getElementById("modalEditar").classList.remove("active");
}

// =========================
// 🔄 ACTUALIZAR INVITADO
// =========================
async function guardarEdicion() {
    const codigo = document.getElementById("edit_codigo").value;
    const nombre = document.getElementById("edit_nombre").value;
    const telefono = document.getElementById("edit_telefono").value;
    const invitados_permitidos = document.getElementById("edit_permitidos").value;
    const confirmados = document.getElementById("edit_confirmados").value;
    const estado = document.getElementById("edit_estado").value;
    const fecha_confirmacion = document.getElementById("edit_fecha").value;
    const motivo = document.getElementById("edit_motivo").value;

    try {
        const res = await fetch(`/api/invitados/${codigo}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                nombre,
                telefono,
                invitados_permitidos: parseInt(invitados_permitidos),
                confirmados: parseInt(confirmados),
                estado,
                fecha_confirmacion: fecha_confirmacion || null,
                motivo: motivo || null
            })
        });

        if (!res.ok) throw new Error("Error actualizar");

        cerrarModalEditar();

        mostrarModalSuccess(
            "Invitado actualizado ✔️",
            "Los datos fueron actualizados correctamente"
        );

        cargarInvitados();

    } catch (error) {
        console.error("❌ Update:", error);
    }
}

// =========================
// 🪟 MODAL ELIMINAR
// =========================
function abrirModalEliminar(codigo, nombre) {
    document.getElementById("delete_codigo").value = codigo;
    document.getElementById("textoEliminar").innerText =
        `¿Seguro que quieres eliminar a "${nombre}"?`;

    document.getElementById("modalEliminar").classList.add("active");
}

function cerrarModalEliminar() {
    document.getElementById("modalEliminar").classList.remove("active");
}

// =========================
// ❌ CONFIRMAR ELIMINACIÓN
// =========================
async function confirmarEliminar() {
    const codigo = document.getElementById("delete_codigo").value;

    try {
        const res = await fetch(`/api/invitados/${codigo}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        cerrarModalEliminar();

        mostrarModalSuccess(
            "Invitado eliminado ✔️",
            "El invitado fue eliminado correctamente"
        );

        cargarInvitados();

    } catch (error) {
        console.error("❌ Delete:", error);
    }
}

function mostrarModalSuccess(titulo, mensaje, codigo = null) {
    document.getElementById("successTitle").innerText = titulo;
    document.getElementById("successMessage").innerText = mensaje;

    const box = document.getElementById("codigoBox");

    if (codigo) {
        box.style.display = "flex";
        document.getElementById("codigoGenerado").value = codigo;
    } else {
        box.style.display = "none";
    }

    document.getElementById("modalSuccess").classList.add("active");
}

function cerrarModalSuccess() {
    document.getElementById("modalSuccess").classList.remove("active");
}

function copiarCodigo() {
    const input = document.getElementById("codigoGenerado");
    navigator.clipboard.writeText(input.value);

    mostrarModalSuccess(
        "Código copiado 📋",
        "Ahora puedes compartirlo con el invitado"
    );
}

let grafica = null;
Chart.register(ChartDataLabels);

async function cargarEstadisticas() {
    try {
        const res = await fetch(`/api/dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        const confirmados = parseInt(data.confirmados) || 0;
        const pendientes = parseInt(data.pendientes) || 0;
        const rechazados = parseInt(data.rechazados) || 0;
        const total = confirmados + pendientes + rechazados;

        const ctx = document.getElementById("graficaInvitados").getContext("2d");

        // 🔥 destruir gráfica anterior (IMPORTANTE)
        if (grafica) {
            grafica.destroy();
        }

        grafica = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Confirmados", "Pendientes", "Rechazados"],
                datasets: [{
                    data: [confirmados, pendientes, rechazados],

                    // 🎨 COLORES MÁS FINOS (NO TAN SATURADOS)
                    backgroundColor: [
                        "rgba(46, 204, 113, 0.85)",
                        "rgba(243, 156, 18, 0.85)",
                        "rgba(231, 76, 60, 0.85)"
                    ],

                    // ✨ BORDE SUAVE
                    borderColor: [
                        "#27ae60",
                        "#d68910",
                        "#c0392b"
                    ],
                    borderWidth: 1.5,

                    // 💎 ESTÉTICA MODERNA
                    borderRadius: 12,
                    borderSkipped: false,

                    // 🔥 HOVER (efecto elegante)
                    hoverBackgroundColor: [
                        "#58d68d",
                        "#f8c471",
                        "#ec7063"
                    ]
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                layout: {
                    padding: 20
                },

                plugins: {
                    legend: {
                        display: false
                    },

                    datalabels: {
                        color: "#fff",

                        anchor: "center",   // 🔥 lo pone dentro de la barra
                        align: "center",    // 🔥 centrado real

                        font: {
                            weight: "bold",
                            size: 13
                        },

                        formatter: (value) => {
                            const porcentaje = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return porcentaje + "%";
                        }
                    },

                    tooltip: {
                        tooltip: {
                            backgroundColor: "#111",
                            titleColor: "#fff",
                            bodyColor: "#fff",
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: false,

                            callbacks: {
                                label: function (context) {
                                    return ` ${context.raw} invitados`;
                                }
                            }
                        }
                    }
                },

                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: "#444",
                            font: {
                                size: 13,
                                weight: "500"
                            }
                        }
                    },

                    y: {
                        beginAtZero: true,

                        grid: {
                            color: "rgba(0,0,0,0.05)"
                        },

                        ticks: {
                            color: "#666",
                            font: {
                                size: 12
                            }
                        }
                    }
                },

                animation: {
                    duration: 1000,
                    easing: "easeOutQuart"
                }
            }
        });

    } catch (error) {
        console.error("Error estadísticas:", error);
    }
}

function mostrarSeccion(id) {
    document.querySelectorAll(".seccion").forEach(sec => {
        sec.classList.remove("active");
    });

    const section = document.getElementById(id);
    if (section) section.classList.add("active");

    if (id === "ver") cargarInvitados();

    if (id === "estadisticas") cargarEstadisticas(); // 👈 clave
}

// =========================
// 🚀 INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
    cargarDashboard();
});

document.addEventListener("click", (e) => {
    const menu = document.getElementById("submenuInvitados");
    const trigger = document.querySelector(".dropdown span");

    if (!menu.contains(e.target) && !trigger.contains(e.target)) {
        menu.classList.remove("active");
    }
});

lucide.createIcons();