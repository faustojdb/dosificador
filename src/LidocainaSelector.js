import React, { useState, useEffect } from 'react';

// Guías clínicas basadas en evidencia para lidocaína 1% en inyecciones IM
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
    restriccionPeso: 5, // kg mínimo
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
  // Medicamentos sin guía específica de lidocaína IM
  adrenalina: { recomendado: false, motivoNoRecomendado: 'No aplica para adrenalina IM.' },
  ondansetron: { recomendado: false, motivoNoRecomendado: 'No hay evidencia de beneficio.' },
  atropina: { recomendado: false, motivoNoRecomendado: 'No aplica para atropina.' },
  dexametasona: { recomendado: false, motivoNoRecomendado: 'No hay evidencia de beneficio para dexametasona IM.' },
  metoclopramida: { recomendado: false, motivoNoRecomendado: 'No hay evidencia de beneficio.' },
  diazepam: { recomendado: false, motivoNoRecomendado: 'Incompatible con otros medicamentos en la misma jeringa.' },
  lorazepam: { recomendado: false, motivoNoRecomendado: 'Lorazepam se administra preferentemente IV, no IM.' }
};

const LidocainaSelector = ({
  valorActual,
  medicamento,
  peso,
  edadEnMeses,
  onChange,
  darkMode
}) => {
  const [volumenPersonalizado, setVolumenPersonalizado] = useState(
    valorActual?.toString() || '1.0'
  );
  const [error, setError] = useState('');
  const [mostrarSelector, setMostrarSelector] = useState(valorActual > 0);

  useEffect(() => {
    setVolumenPersonalizado(valorActual?.toString() || '1.0');
    setMostrarSelector(valorActual > 0);
  }, [valorActual]);

  const guia = GUIAS_LIDOCAINA[medicamento?.id] || null;

  // Si no es recomendado, mostrar motivo y no permitir selección
  if (guia && !guia.recomendado) {
    return (
      <div className={`mt-2 p-2 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
        <span className="font-medium">Lidocaína 1%: </span>
        <span className={darkMode ? 'text-red-400' : 'text-red-600'}>No recomendado. </span>
        {guia.motivoNoRecomendado}
        {guia.nota && <span className="block mt-1 italic">{guia.nota}</span>}
      </div>
    );
  }

  // Si no hay guía, no mostrar nada
  if (!guia) return null;

  // Obtener volumen recomendado según la dosis/presentación
  const getVolumenRecomendado = () => {
    if (!guia.volumenesSegunDosis || !medicamento) return null;
    const match = guia.volumenesSegunDosis.find(v => {
      // Para penicilina, la concentración es en UI (números grandes)
      if (medicamento.presentacionesComerciales) {
        const pres = medicamento.presentacionesComerciales.find(p => p.principal) || medicamento.presentacionesComerciales[0];
        return pres && v.dosis === pres.concentracion;
      }
      return false;
    });
    return match || guia.volumenesSegunDosis[0];
  };

  // Verificar restricciones de edad/peso
  const getRestriccion = () => {
    if (guia.restriccionPeso && peso && peso < guia.restriccionPeso) {
      return guia.restriccionNota || `Paciente < ${guia.restriccionPeso} kg: no usar lidocaína.`;
    }
    if (guia.edadMinMeses && edadEnMeses !== undefined && edadEnMeses < guia.edadMinMeses) {
      return guia.restriccionNota || `Menor de ${guia.edadMinMeses} meses: no usar lidocaína.`;
    }
    return null;
  };

  const restriccion = getRestriccion();
  const volRecomendado = getVolumenRecomendado();

  // Colores según nivel de evidencia
  const evidenciaColor = guia.evidencia === 'alta'
    ? darkMode ? 'text-green-400' : 'text-green-600'
    : darkMode ? 'text-yellow-400' : 'text-yellow-600';

  const handleVolumenChange = (e) => {
    const valor = e.target.value;
    setVolumenPersonalizado(valor);

    const volumen = parseFloat(valor);
    if (isNaN(volumen) || volumen <= 0) {
      setError('El volumen debe ser un número positivo');
      return;
    }
    if (volumen > 5) {
      setError('Volumen máximo recomendado: 5 ml');
      return;
    }
    setError('');
    onChange(volumen);
  };

  return (
    <div className="mt-2">
      <div className="flex items-center mb-1 justify-between">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={mostrarSelector}
            onChange={(e) => {
              setMostrarSelector(e.target.checked);
              if (!e.target.checked) {
                onChange(0);
              } else {
                const vol = volRecomendado ? volRecomendado.volumenMl : 1.0;
                setVolumenPersonalizado(vol.toString());
                onChange(vol);
              }
            }}
            className="mr-2 h-4 w-4"
            disabled={!!restriccion}
          />
          <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Lidocaína 1%
          </label>
          <span className={`ml-2 text-xs ${evidenciaColor}`}>
            (Evidencia {guia.evidencia})
          </span>
        </div>

        {mostrarSelector && (
          <div className={`text-xs py-0.5 px-2 rounded ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
            +{volumenPersonalizado} ml
          </div>
        )}
      </div>

      {restriccion && (
        <div className={`text-xs p-1.5 rounded mb-1 ${darkMode ? 'bg-red-900 bg-opacity-30 text-red-300' : 'bg-red-50 text-red-600'}`}>
          {restriccion}
        </div>
      )}

      {mostrarSelector && !restriccion && (
        <>
          {/* Volúmenes según guía clínica */}
          <div className="flex gap-2 mb-1">
            {guia.volumenesSegunDosis?.map((v, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setVolumenPersonalizado(v.volumenMl.toString());
                  setError('');
                  onChange(v.volumenMl);
                }}
                className={`px-2 py-1 text-xs rounded ${
                  parseFloat(volumenPersonalizado) === v.volumenMl
                    ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {v.volumenMl} ml
                {v.dosis ? ` (${v.dosis >= 10000 ? (v.dosis / 1000).toLocaleString() + 'K' : v.dosis}${medicamento?.presentacionesComerciales?.[0]?.unidad || 'mg'})` : ''}
              </button>
            ))}
          </div>

          {/* Input personalizado */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0.5"
              max="5"
              step="0.1"
              value={volumenPersonalizado}
              onChange={handleVolumenChange}
              className={`block w-20 px-2 py-1 text-sm rounded-md ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            <span className="text-xs">ml</span>
          </div>

          {error && (
            <p className={`text-xs mt-1 ${darkMode ? 'text-red-400' : 'text-red-500'}`}>{error}</p>
          )}

          {/* Guía clínica */}
          <div className={`text-xs mt-1.5 p-1.5 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
            <strong>Guía: </strong>{guia.nota}
          </div>

          {guia.advertencia && (
            <div className={`text-xs mt-1 p-1.5 rounded font-medium ${darkMode ? 'bg-yellow-900 bg-opacity-30 text-yellow-300' : 'bg-yellow-50 text-yellow-700'}`}>
              {guia.advertencia}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LidocainaSelector;
