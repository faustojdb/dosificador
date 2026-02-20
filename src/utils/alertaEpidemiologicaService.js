import alertasData from '../data/alertasEpidemiologicas.json';

/**
 * Evalúa alertas epidemiológicas según los síntomas activos.
 * Retorna alertas activas con nivel de confianza.
 */
export function evaluarAlertasEpidemiologicas(sintomasActivos) {
  if (!sintomasActivos || sintomasActivos.length === 0) return [];

  return alertasData.enfermedades
    .map(enfermedad => {
      const cardinalesMatch = enfermedad.sintomasCardinales.filter(s => sintomasActivos.includes(s));
      const apoyoMatch = (enfermedad.sintomasApoyo || []).filter(s => sintomasActivos.includes(s));

      // Si no alcanza el umbral de cardinales, no activar
      if (cardinalesMatch.length < enfermedad.umbralCardinales) return null;

      // Calcular confianza
      const totalCardinales = enfermedad.sintomasCardinales.length;
      const totalApoyo = (enfermedad.sintomasApoyo || []).length;
      const totalPonderado = totalCardinales * 2 + totalApoyo;
      const scorePonderado = cardinalesMatch.length * 2 + apoyoMatch.length;
      const confianza = Math.round((scorePonderado / totalPonderado) * 100);

      // Banderas rojas activas
      const banderasActivas = (enfermedad.banderasRojas || [])
        .filter(b => sintomasActivos.includes(b.sintoma));

      return {
        id: enfermedad.id,
        nombre: enfermedad.nombre,
        color: enfermedad.color,
        confianza,
        banderasActivas,
        medicamentosPermitidos: enfermedad.medicamentosPermitidos,
        medicamentosProhibidos: enfermedad.medicamentosProhibidos,
        guiaDiferencial: enfermedad.guiaDiferencial,
        conducta: enfermedad.conducta,
        cardinalesMatch,
        apoyoMatch
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.confianza - a.confianza);
}

/**
 * Verifica si un medicamento está prohibido por alguna alerta epidemiológica activa.
 * Retorna { prohibido: boolean, alertas: [{ nombre, razon }] }
 */
export function verificarProhibicionEpidemiologica(medId, alertasActivas) {
  if (!alertasActivas || alertasActivas.length === 0) {
    return { prohibido: false, alertas: [] };
  }

  const alertasProhibicion = alertasActivas
    .filter(alerta => alerta.medicamentosProhibidos.some(p => p.id === medId))
    .map(alerta => {
      const prohibicion = alerta.medicamentosProhibidos.find(p => p.id === medId);
      return {
        nombre: alerta.nombre,
        razon: prohibicion.razon
      };
    });

  return {
    prohibido: alertasProhibicion.length > 0,
    alertas: alertasProhibicion
  };
}
