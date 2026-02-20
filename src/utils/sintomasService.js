import sintomasData from '../data/sintomasData.json';

/**
 * Retorna los síntomas disponibles agrupados.
 */
export function getSintomasDisponibles() {
  return {
    grupos: sintomasData.grupos,
    sintomas: sintomasData.grupos.flatMap(g => g.sintomas)
  };
}

/**
 * Retorna todos los cuadros clínicos disponibles (para la sección de selección directa).
 */
export function getCuadrosDisponibles() {
  return sintomasData.cuadrosClinicos.map(cuadro => ({
    id: cuadro.id,
    nombre: cuadro.nombre,
    descripcion: cuadro.descripcion,
    medicamentosRecomendados: cuadro.medicamentosRecomendados,
    notasClinicas: cuadro.notasClinicas,
    esEmergencia: cuadro.esEmergencia || false
  }));
}

/**
 * Evalúa cuadros clínicos según los síntomas activos.
 * Score = (requeridos_coincidentes × 2 + opcionales_coincidentes × 1) / total_ponderado × 100
 * Solo retorna cuadros que cumplen el umbral mínimo de requeridos.
 */
export function evaluarCuadrosClinicos(sintomasActivos) {
  if (!sintomasActivos || sintomasActivos.length === 0) return [];

  const resultados = sintomasData.cuadrosClinicos
    .map(cuadro => {
      const reqCoincidentes = cuadro.sintomasRequeridos.filter(s => sintomasActivos.includes(s));
      const opcCoincidentes = (cuadro.sintomasOpcionales || []).filter(s => sintomasActivos.includes(s));

      // Verificar umbral mínimo de requeridos
      if (reqCoincidentes.length < cuadro.umbralMinimo) return null;

      const totalPonderado = cuadro.sintomasRequeridos.length * 2 + (cuadro.sintomasOpcionales || []).length;
      const scorePonderado = reqCoincidentes.length * 2 + opcCoincidentes.length;
      const porcentaje = Math.round((scorePonderado / totalPonderado) * 100);

      return {
        cuadroId: cuadro.id,
        nombre: cuadro.nombre,
        descripcion: cuadro.descripcion,
        porcentaje,
        medicamentosRecomendados: cuadro.medicamentosRecomendados,
        notasClinicas: cuadro.notasClinicas,
        esEmergencia: cuadro.esEmergencia || false,
        sintomasRequeridosMatch: reqCoincidentes,
        sintomasOpcionalesMatch: opcCoincidentes
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.porcentaje - a.porcentaje);

  return resultados;
}
