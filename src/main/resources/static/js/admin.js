/**
 * admin.js
 * Archivo principal del panel de administración
 * - Inicializa el sistema
 * - Define variables globales compartidas
 */

// ================================
// 0. INICIO AUTOMÁTICO
// ================================
document.addEventListener("DOMContentLoaded", () => {
  cargarMetricas();
});

// ================================
// VARIABLES GLOBALES
// ================================
let listaUsuariosGlobal = [];
