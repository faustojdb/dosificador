/**
 * Servicio de consulta de interacciones droga-enfermedad
 * basado en datos curados de DDInter 2.0 (open access).
 */

import ddinterData from '../data/ddinterData.json';

/**
 * Busca contraindicaciones/alertas para un medicamento dado un set de condiciones.
 * @param {string} medicamentoId - ID del medicamento
 * @param {string[]} condiciones - Array de condiciones activas (ej: ['embarazo', 'renal'])
 * @returns {Array<{condicion, severidad, mensaje, recomendacion}>}
 */
export function buscarInteraccionesDrogaEnfermedad(medicamentoId, condiciones) {
  if (!condiciones || condiciones.length === 0) return [];

  const medData = ddinterData.medicamentos[medicamentoId];
  if (!medData) return [];

  const alertas = [];
  for (const condicion of condiciones) {
    const interaccion = medData.interacciones?.find(i => i.condicion === condicion);
    if (interaccion) {
      alertas.push({
        medicamentoId,
        condicion,
        severidad: interaccion.severidad,
        mensaje: interaccion.mensaje,
        recomendacion: interaccion.recomendacion
      });
    }
  }

  return alertas;
}

/**
 * Busca alertas droga-enfermedad para TODOS los medicamentos seleccionados.
 * @param {string[]} medicamentosIds - Array de IDs de medicamentos seleccionados
 * @param {string[]} condiciones - Array de condiciones activas
 * @returns {Array}
 */
export function buscarTodasInteracciones(medicamentosIds, condiciones) {
  if (!medicamentosIds || !condiciones || condiciones.length === 0) return [];

  const alertas = [];
  for (const medId of medicamentosIds) {
    alertas.push(...buscarInteraccionesDrogaEnfermedad(medId, condiciones));
  }

  // Ordenar por severidad: alta > media > baja
  const orden = { alta: 0, media: 1, baja: 2 };
  alertas.sort((a, b) => (orden[a.severidad] || 3) - (orden[b.severidad] || 3));

  return alertas;
}

/**
 * Retorna la lista de condiciones disponibles con sus labels.
 */
export function getCondicionesDisponibles() {
  return ddinterData.condiciones || [];
}

/**
 * Verifica si un medicamento debe estar BLOQUEADO por las condiciones del paciente.
 * Retorna 'bloqueado' si hay al menos una interacción con bloquear:true,
 * 'precaucion' si hay severidad 'alta' sin bloquear, o null si no hay conflicto.
 * @param {string} medicamentoId
 * @param {string[]} condiciones - condiciones activas del paciente
 * @returns {'bloqueado'|'precaucion'|null}
 */
export function getEstadoPorCondiciones(medicamentoId, condiciones) {
  if (!condiciones || condiciones.length === 0) return null;

  const medData = ddinterData.medicamentos[medicamentoId];
  if (!medData || !medData.interacciones) return null;

  let tienePrecaucion = false;

  for (const condicion of condiciones) {
    const interaccion = medData.interacciones.find(i => i.condicion === condicion);
    if (interaccion) {
      if (interaccion.bloquear) {
        return 'bloqueado';
      }
      if (interaccion.severidad === 'alta') {
        tienePrecaucion = true;
      }
    }
  }

  return tienePrecaucion ? 'precaucion' : null;
}
