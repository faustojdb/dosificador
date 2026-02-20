import { snapToGrid } from './snapGrid';

// Guías clínicas basadas en evidencia para lidocaína 1% en inyecciones IM
// Movido desde LidocainaSelector.js para centralizar la lógica
const GUIAS_LIDOCAINA = {
  ceftriaxona: {
    recomendado: true,
    evidencia: 'alta',
    nota: 'Diluyente aprobado por FDA. Lidocaína 1% sin epinefrina.',
    volumenesSegunDosis: [
      { dosis: 250, volumenMl: 0.9 },
      { dosis: 500, volumenMl: 1.0 },
      { dosis: 1000, volumenMl: 2.1 },
      { dosis: 2000, volumenMl: 3.5 }
    ],
    restriccionPeso: 5,
    restriccionNota: 'Solo en pacientes >5 kg. Menores usar agua estéril.',
    advertencia: 'La solución con lidocaína NO debe administrarse IV.'
  },
  penicilina: {
    recomendado: true,
    evidencia: 'alta',
    nota: 'Revisión sistemática Lancet confirma reducción significativa del dolor sin alterar farmacocinética.',
    volumenesSegunDosis: [
      { dosis: 600000, volumenMl: 1.5 },
      { dosis: 1200000, volumenMl: 2.5 },
      { dosis: 2400000, volumenMl: 3.0 }
    ],
    edadMinMeses: 12,
    restriccionNota: 'Menores de 1 año: reconstituir con agua estéril para inyectables.'
  },
  diclofenac: {
    recomendado: true,
    evidencia: 'moderada',
    nota: 'Existen presentaciones comerciales premezcladas (ej: Rispain Plus: 75mg diclofenac + 20mg lidocaína).',
    volumenesSegunDosis: [
      { dosis: 75, volumenMl: 2.0 }
    ],
    restriccionNota: 'Preferir presentaciones comerciales premezcladas cuando estén disponibles.'
  },
  metamizol: {
    recomendado: true,
    evidencia: 'moderada',
    nota: 'Existen presentaciones comerciales premezcladas. No mezclar con otros medicamentos en la misma jeringa.',
    volumenesSegunDosis: [
      { dosis: 1000, volumenMl: 1.0 },
      { dosis: 500, volumenMl: 0.5 }
    ]
  },
  ketorolaco: {
    recomendado: true,
    evidencia: 'moderada',
    nota: 'Estudio clínico demostró buena tolerancia. Lidocaína no está entre las incompatibilidades conocidas.',
    volumenesSegunDosis: [
      { dosis: 30, volumenMl: 1.0 },
      { dosis: 60, volumenMl: 1.5 }
    ],
    advertencia: 'NO mezclar con morfina, meperidina, prometazina o hidroxizina.'
  },
  hidrocortisona: {
    recomendado: false,
    evidencia: 'alta',
    nota: 'Contraindicado por fabricante (Solu-Cortef). No debe diluirse ni mezclarse con otras soluciones.',
    motivoNoRecomendado: 'Incompatibilidad física según ficha técnica del fabricante (Pfizer).'
  },
  tramadol: {
    recomendado: false,
    evidencia: 'moderada',
    nota: 'Ambos reducen el umbral convulsivo. Riesgo aditivo de convulsiones.',
    motivoNoRecomendado: 'Interacción farmacodinámica: riesgo aumentado de convulsiones.'
  },
  difenhidramina: {
    recomendado: false,
    evidencia: 'moderada',
    nota: 'La difenhidramina tiene propiedades anestésicas locales propias (bloqueo de canales de sodio similar a lidocaína).',
    motivoNoRecomendado: 'Redundante: el medicamento ya tiene efecto anestésico local.'
  },
  adrenalina: { recomendado: false, motivoNoRecomendado: 'No aplica para adrenalina IM.' },
  ondansetron: { recomendado: false, motivoNoRecomendado: 'No hay evidencia de beneficio.' },
  atropina: { recomendado: false, motivoNoRecomendado: 'No aplica para atropina.' },
  dexametasona: { recomendado: false, motivoNoRecomendado: 'No hay evidencia de beneficio para dexametasona IM.' },
  metoclopramida: { recomendado: false, motivoNoRecomendado: 'No hay evidencia de beneficio.' },
  diazepam: { recomendado: false, motivoNoRecomendado: 'Incompatible con otros medicamentos en la misma jeringa.' },
  lorazepam: { recomendado: false, motivoNoRecomendado: 'Lorazepam se administra preferentemente IV, no IM.' }
};

/**
 * Evalúa si la lidocaína es compatible con la combinación de medicamentos en la jeringa.
 * Si CUALQUIER medicamento es incompatible, la jeringa entera no lleva lidocaína.
 */
export function evaluarCompatibilidadLidocaina(medicamentosIds, pesoKg, edadEnMeses, condicionesPaciente = []) {
  const razones = [];

  // Verificar alergia a anestésicos locales
  if (condicionesPaciente.includes('alergia_anestesicos')) {
    return {
      disponible: false,
      razones: ['Paciente con alergia a anestésicos locales'],
      resumen: 'Contraindicado por alergia'
    };
  }

  // Verificar cada medicamento
  let hayAlgunRecomendado = false;

  for (const medId of medicamentosIds) {
    const guia = GUIAS_LIDOCAINA[medId];

    if (!guia || !guia.recomendado) {
      const motivo = guia?.motivoNoRecomendado || 'No hay evidencia de compatibilidad con lidocaína';
      razones.push({ medId, motivo, bloquea: true });
    } else {
      hayAlgunRecomendado = true;
    }
  }

  // Si cualquier medicamento bloquea → toda la jeringa sin lidocaína
  const bloqueantes = razones.filter(r => r.bloquea);
  if (bloqueantes.length > 0) {
    return {
      disponible: false,
      razones: bloqueantes.map(r => `${r.medId}: ${r.motivo}`),
      resumen: `Incompatible con ${bloqueantes.map(r => r.medId).join(', ')}`
    };
  }

  // Si no hay ningún medicamento recomendado
  if (!hayAlgunRecomendado) {
    return {
      disponible: false,
      razones: ['Ningún medicamento seleccionado es compatible con lidocaína'],
      resumen: 'Sin medicamentos compatibles'
    };
  }

  return {
    disponible: true,
    razones: [],
    resumen: 'Lidocaína disponible para esta combinación'
  };
}

/**
 * Calcula el volumen de lidocaína para la jeringa completa.
 * Suma aportes de cada medicamento compatible, luego capea por seguridad (4.5 mg/kg).
 */
export function calcularVolumenLidocaina(medicamentosIds, dosisCalculadas, pesoKg, edadEnMeses) {
  const desglose = [];
  const advertencias = [];
  let volumenBruto = 0;

  for (const medId of medicamentosIds) {
    const guia = GUIAS_LIDOCAINA[medId];
    if (!guia || !guia.recomendado || !guia.volumenesSegunDosis) continue;

    // Verificar restricciones de peso/edad (no bloquean, pero anulan aporte)
    if (guia.restriccionPeso && pesoKg && pesoKg < guia.restriccionPeso) {
      advertencias.push(`${medId}: sin lidocaína por peso < ${guia.restriccionPeso} kg (${guia.restriccionNota || ''})`);
      desglose.push({ medId, volumenMl: 0, motivo: 'restricción de peso' });
      continue;
    }
    if (guia.edadMinMeses && edadEnMeses !== undefined && edadEnMeses < guia.edadMinMeses) {
      advertencias.push(`${medId}: sin lidocaína por edad < ${guia.edadMinMeses} meses (${guia.restriccionNota || ''})`);
      desglose.push({ medId, volumenMl: 0, motivo: 'restricción de edad' });
      continue;
    }

    // Obtener dosis calculada real para este medicamento
    const dosisInfo = dosisCalculadas[medId];
    let dosisReal = 0;
    if (dosisInfo && dosisInfo.dosisCalculada) {
      dosisReal = parseFloat(dosisInfo.dosisCalculada);
    }

    // Buscar volumen: la entrada cuya dosis sea la más cercana por abajo
    let mejorMatch = null;
    for (const entrada of guia.volumenesSegunDosis) {
      if (dosisReal > 0 && entrada.dosis <= dosisReal) {
        if (!mejorMatch || entrada.dosis > mejorMatch.dosis) {
          mejorMatch = entrada;
        }
      }
    }

    // Si no hay match por abajo (dosis muy baja), usar la primera entrada
    if (!mejorMatch && guia.volumenesSegunDosis.length > 0) {
      mejorMatch = guia.volumenesSegunDosis[0];
    }

    if (mejorMatch) {
      desglose.push({ medId, volumenMl: mejorMatch.volumenMl, dosisRef: mejorMatch.dosis });
      volumenBruto += mejorMatch.volumenMl;
    }
  }

  // Si no hay volumen → retornar null
  if (volumenBruto === 0) {
    return null;
  }

  // Límite de seguridad: 4.5 mg/kg, lidocaína 1% = 10 mg/ml → 0.45 ml/kg
  const volumenMaxSeguro = snapToGrid(0.45 * pesoKg);
  const fueCapado = volumenBruto > volumenMaxSeguro;
  const volumenRecomendado = snapToGrid(Math.min(volumenBruto, volumenMaxSeguro));

  if (fueCapado) {
    advertencias.push(`Volumen ajustado de ${volumenBruto.toFixed(1)} ml a ${volumenRecomendado} ml por límite de seguridad (4.5 mg/kg = ${volumenMaxSeguro} ml para ${pesoKg} kg)`);
  }

  // Volumen reducido si bruto > 2.0 ml
  let volumenReducido = null;
  if (volumenBruto > 2.0) {
    const reducidoBruto = volumenBruto * 0.75;
    volumenReducido = snapToGrid(Math.min(reducidoBruto, volumenMaxSeguro));
  }

  return {
    volumenRecomendado,
    volumenReducido,
    volumenMaxSeguro,
    fueCapado,
    desglose,
    advertencias
  };
}

/**
 * Retorna notas clínicas y advertencias para los medicamentos seleccionados.
 */
export function obtenerNotasClinicas(medicamentosIds) {
  const notas = [];

  for (const medId of medicamentosIds) {
    const guia = GUIAS_LIDOCAINA[medId];
    if (!guia) continue;

    const nota = {
      medId,
      recomendado: guia.recomendado,
      evidencia: guia.evidencia || null,
      nota: guia.nota || null,
      advertencia: guia.advertencia || null,
      motivoNoRecomendado: guia.motivoNoRecomendado || null
    };

    notas.push(nota);
  }

  return notas;
}
