/**
 * Calcula dosis usando datos estructurados numéricos (sin regex).
 * Recibe el medicamento completo, peso, edad en meses, vía y presentación.
 * Retorna objeto de dosis compatible con el formato existente de App.js,
 * o null si no hay datos estructurados disponibles (fallback a regex).
 */

export function calcularDosisEstructurada(medicamento, peso, edadEnMeses, via, presentacion) {
  const de = medicamento.dosisEstructurada;
  if (!de) return null;

  const concentracionPorMl = presentacion.concentracion / presentacion.volumenMl;
  const esAdulto = edadEnMeses >= 216; // >= 18 años
  const esAncianoAdulto = edadEnMeses >= 780; // >= 65 años

  // --- ADULTOS ---
  if (esAdulto && de.adultos) {
    // Ancianos
    if (esAncianoAdulto && de.adultos.ancianos) {
      const anc = de.adultos.ancianos;
      let dosisMg;

      if (anc.dosisMinMg !== undefined) {
        dosisMg = (anc.dosisMinMg + (anc.dosisMaxMg || anc.dosisMinMg)) / 2;
      } else if (anc.factorReduccion && de.adultos.estandar) {
        const est = de.adultos.estandar;
        const dosisBase = (est.dosisMinMg + (est.dosisMaxMg || est.dosisMinMg)) / 2;
        dosisMg = dosisBase * anc.factorReduccion;
      } else {
        return null;
      }

      if (anc.porPeso && peso) {
        dosisMg = dosisMg * peso;
      }

      if (anc.maxDosisPorToma && dosisMg > anc.maxDosisPorToma) {
        dosisMg = anc.maxDosisPorToma;
      }

      const volumenMl = dosisMg / concentracionPorMl;
      const frecTexto = anc.frecuenciaHoras
        ? `cada ${anc.frecuenciaHoras[0]}${anc.frecuenciaHoras.length > 1 ? '-' + anc.frecuenciaHoras[anc.frecuenciaHoras.length - 1] : ''} horas`
        : de.adultos.estandar?.frecuenciaHoras
          ? `cada ${de.adultos.estandar.frecuenciaHoras[0]}-${de.adultos.estandar.frecuenciaHoras[de.adultos.estandar.frecuenciaHoras.length - 1]} horas`
          : '';

      return {
        mensaje: `Dosis adulto mayor: reducida`,
        explicacion: `${dosisMg.toFixed(0)} ${presentacion.unidad} (${volumenMl.toFixed(1)} ml) ${frecTexto}`,
        adulto: true,
        precaucion: true,
        volumenMl: volumenMl.toFixed(1),
        dosisCalculada: dosisMg.toFixed(0),
        unidad: presentacion.unidad,
        presentacion,
        fuenteEstructurada: true
      };
    }

    // Adulto estándar
    if (de.adultos.estandar) {
      const est = de.adultos.estandar;
      let dosisMg;

      if (est.porPeso && peso) {
        const dosisPromedio = (est.dosisMinMgKg + (est.dosisMaxMgKg || est.dosisMinMgKg)) / 2;
        dosisMg = dosisPromedio * peso;
      } else {
        dosisMg = (est.dosisMinMg + (est.dosisMaxMg || est.dosisMinMg)) / 2;
      }

      if (est.maxDosisPorToma && dosisMg > est.maxDosisPorToma) {
        dosisMg = est.maxDosisPorToma;
      }

      const volumenMl = dosisMg / concentracionPorMl;
      const frecTexto = est.frecuenciaHoras
        ? `cada ${est.frecuenciaHoras[0]}${est.frecuenciaHoras.length > 1 ? '-' + est.frecuenciaHoras[est.frecuenciaHoras.length - 1] : ''} horas`
        : '';

      // Formatear según unidad (UI necesita separadores de miles)
      const esUI = presentacion.unidad === 'UI';
      const dosisDisplay = esUI ? dosisMg.toLocaleString() : dosisMg.toFixed(1);

      return {
        mensaje: `Dosis adulto estándar`,
        explicacion: `${dosisDisplay} ${presentacion.unidad} (${volumenMl.toFixed(1)} ml) ${frecTexto}`,
        adulto: true,
        volumenMl: volumenMl.toFixed(1),
        dosisCalculada: esUI ? dosisMg : dosisMg.toFixed(1),
        unidad: presentacion.unidad,
        presentacion,
        fuenteEstructurada: true
      };
    }
  }

  // --- PEDIÁTRICOS ---
  if (!esAdulto && de.pediatricos && de.pediatricos.length > 0) {
    // Buscar rango de edad que coincida
    const rango = de.pediatricos.find(r => {
      const minMeses = r.edadMinMeses !== undefined ? r.edadMinMeses : (r.edadMinAnos || 0) * 12;
      const maxMeses = r.edadMaxMeses !== undefined ? r.edadMaxMeses : (r.edadMaxAnos || 18) * 12;
      return edadEnMeses >= minMeses && edadEnMeses <= maxMeses;
    });

    if (!rango) return null;

    // Verificar si la vía es compatible
    if (rango.vias && rango.vias.length > 0 && !rango.vias.some(v => via.includes(v) || v.includes(via))) {
      // Vía no compatible, pero no retornamos contraindicado - dejamos que el fallback maneje
    }

    let dosisMg;
    const esUI = presentacion.unidad === 'UI';

    if (rango.dosisMinMgKg !== undefined) {
      // Dosis por peso
      const dosisPromedio = (rango.dosisMinMgKg + (rango.dosisMaxMgKg || rango.dosisMinMgKg)) / 2;
      dosisMg = dosisPromedio * peso;

      if (rango.maxDosisPorToma && dosisMg > rango.maxDosisPorToma) {
        dosisMg = rango.maxDosisPorToma;
      }
    } else if (rango.dosisMinUIKg !== undefined) {
      // Dosis en UI por peso
      const dosisPromedio = (rango.dosisMinUIKg + (rango.dosisMaxUIKg || rango.dosisMinUIKg)) / 2;
      dosisMg = dosisPromedio * peso;

      if (rango.maxDosisPorToma && dosisMg > rango.maxDosisPorToma) {
        dosisMg = rango.maxDosisPorToma;
      }
    } else if (rango.dosisMinMg !== undefined) {
      // Dosis fija
      dosisMg = (rango.dosisMinMg + (rango.dosisMaxMg || rango.dosisMinMg)) / 2;
    } else {
      return null;
    }

    const volumenMl = dosisMg / concentracionPorMl;
    const frecTexto = rango.frecuenciaHoras
      ? `cada ${rango.frecuenciaHoras[0]}${rango.frecuenciaHoras.length > 1 ? '-' + rango.frecuenciaHoras[rango.frecuenciaHoras.length - 1] : ''} horas`
      : '';
    const viasTexto = rango.vias ? rango.vias.join(' o ') : '';
    const dosisDisplay = esUI ? dosisMg.toLocaleString() : dosisMg.toFixed(1);

    return {
      mensaje: `Dosis: ${dosisDisplay} ${presentacion.unidad} ${viasTexto} ${frecTexto}`,
      explicacion: `${dosisDisplay} ${presentacion.unidad} (${volumenMl.toFixed(1)} ml)`,
      adulto: false,
      contraindicado: false,
      volumenMl: volumenMl.toFixed(1),
      dosisCalculada: esUI ? dosisMg : dosisMg.toFixed(1),
      unidad: presentacion.unidad,
      presentacion,
      fuenteEstructurada: true
    };
  }

  return null; // No hay datos estructurados para este caso
}
