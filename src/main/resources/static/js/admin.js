/**
 * admin.js
 * Configuración global y Utilidades de Seguridad
 */

// Variables globales
let listaUsuariosGlobal = [];

// Inicio automático
document.addEventListener("DOMContentLoaded", () => {
    cargarMetricas();
});

//Obtener cabeceras de seguridad (CSRF)
// Esto es lo que permite que el JS hable con el Spring Boot seguro
function getAuthHeaders() {
    const token = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const header = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    return {
        [header]: token

    };
}