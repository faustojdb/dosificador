/**
 * Gestión de presets guardados en localStorage.
 * Cada preset almacena: nombre, datos del paciente, medicamentos seleccionados,
 * presentaciones elegidas, vía de administración, y timestamp.
 */

const STORAGE_KEY = 'dosificador_presets';
const MAX_SLOTS = 4;

function getAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : Array(MAX_SLOTS).fill(null);
  } catch {
    return Array(MAX_SLOTS).fill(null);
  }
}

function saveAll(presets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

/**
 * Guarda un preset en el slot indicado (0-3).
 */
export function guardarPreset(slot, datos) {
  if (slot < 0 || slot >= MAX_SLOTS) return false;
  const presets = getAll();
  presets[slot] = {
    ...datos,
    guardadoEn: new Date().toISOString()
  };
  saveAll(presets);
  return true;
}

/**
 * Carga un preset del slot indicado.
 * Retorna null si el slot está vacío.
 */
export function cargarPreset(slot) {
  if (slot < 0 || slot >= MAX_SLOTS) return null;
  const presets = getAll();
  return presets[slot] || null;
}

/**
 * Elimina un preset del slot indicado.
 */
export function eliminarPreset(slot) {
  if (slot < 0 || slot >= MAX_SLOTS) return false;
  const presets = getAll();
  presets[slot] = null;
  saveAll(presets);
  return true;
}

/**
 * Retorna todos los presets (array de 4 elementos, null si vacío).
 */
export function listarPresets() {
  return getAll();
}

export { MAX_SLOTS };
