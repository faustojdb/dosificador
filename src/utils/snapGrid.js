/**
 * Redondeo inteligente de volúmenes a graduaciones medibles de jeringas estándar.
 * Siempre redondea HACIA ABAJO (floor) por seguridad: mejor dar levemente menos que más.
 */

// Graduaciones mínimas por tamaño de jeringa
const SYRINGE_GRIDS = [
  { maxMl: 1,  stepMl: 0.05, label: '1 mL' },
  { maxMl: 3,  stepMl: 0.1,  label: '3 mL' },
  { maxMl: 5,  stepMl: 0.2,  label: '5 mL' },
  { maxMl: 10, stepMl: 0.5,  label: '10 mL' },
  { maxMl: 20, stepMl: 1.0,  label: '20 mL' },
];

/**
 * Determina la jeringa más pequeña que puede contener el volumen dado.
 */
export function getSyringeCapacity(volumenMl) {
  const vol = parseFloat(volumenMl);
  if (isNaN(vol) || vol <= 0) return SYRINGE_GRIDS[0];
  for (const syringe of SYRINGE_GRIDS) {
    if (vol <= syringe.maxMl) return syringe;
  }
  return SYRINGE_GRIDS[SYRINGE_GRIDS.length - 1];
}

/**
 * Redondea un volumen hacia abajo al step de la jeringa adecuada.
 * @param {number|string} volumenMl - Volumen original en mL
 * @returns {number} Volumen redondeado hacia abajo
 */
export function snapToGrid(volumenMl) {
  const vol = parseFloat(volumenMl);
  if (isNaN(vol) || vol <= 0) return 0;

  const syringe = getSyringeCapacity(vol);
  // Floor al step más cercano
  const snapped = Math.floor(vol / syringe.stepMl) * syringe.stepMl;
  // Asegurar al menos un step si el volumen original era > 0
  return snapped > 0 ? parseFloat(snapped.toFixed(3)) : syringe.stepMl;
}

/**
 * Retorna información completa del redondeo para mostrar en UI.
 * @param {number|string} volumenOriginal - Volumen calculado
 * @returns {{ original: number, snapped: number, syringe: object, diffPercent: number, wasRounded: boolean }}
 */
export function getSnapInfo(volumenOriginal) {
  const original = parseFloat(volumenOriginal);
  if (isNaN(original) || original <= 0 || volumenOriginal === 'Consultar') {
    return { original: 0, snapped: 0, syringe: SYRINGE_GRIDS[0], diffPercent: 0, wasRounded: false };
  }

  const syringe = getSyringeCapacity(original);
  const snapped = snapToGrid(original);
  const diff = original - snapped;
  const diffPercent = original > 0 ? (diff / original) * 100 : 0;

  return {
    original: parseFloat(original.toFixed(3)),
    snapped,
    syringe,
    diffPercent: parseFloat(diffPercent.toFixed(1)),
    wasRounded: diff > 0.001 // tolerancia numérica
  };
}
