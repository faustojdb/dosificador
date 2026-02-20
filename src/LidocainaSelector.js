import React, { useState } from 'react';

/**
 * Panel único de lidocaína a nivel de jeringa.
 * Reemplaza el selector per-medicamento anterior.
 * NO tiene input numérico libre — solo checkbox + opción recomendado/reducido.
 */
const LidocainaSyringePanel = ({
  compatibilidad,
  calculo,
  notasClinicas,
  lidocainaActiva,
  volumenSeleccionado,
  onToggle,
  onOpcionChange,
  opcionActual,
  darkMode,
  pesoKg
}) => {
  const [mostrarNotas, setMostrarNotas] = useState(false);

  // Si no hay compatibilidad data, no renderizar
  if (!compatibilidad) return null;

  // NO compatible: caja roja con razones
  if (!compatibilidad.disponible) {
    return (
      <div className={`rounded-lg p-3 ${darkMode ? 'bg-red-900 bg-opacity-30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-500'}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className={`font-medium text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
            Lidocaína no disponible para esta combinación
          </span>
        </div>
        <ul className={`text-xs space-y-1 ml-7 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
          {compatibilidad.razones.map((razon, idx) => (
            <li key={idx}>{razon}</li>
          ))}
        </ul>
      </div>
    );
  }

  // Compatible pero sin cálculo (edge case)
  if (!calculo) return null;

  // Notas de evidencia para medicamentos recomendados
  const notasRecomendadas = notasClinicas.filter(n => n.recomendado && n.nota);

  return (
    <div className={`rounded-lg p-3 ${darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-purple-50 border border-purple-200'}`}>
      {/* Toggle principal */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={lidocainaActiva}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <span className={`font-medium text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          Agregar Lidocaína 1%
        </span>
        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          (anestésico local)
        </span>
      </label>

      {/* Contenido cuando está activada */}
      {lidocainaActiva && (
        <div className="mt-3 space-y-2">
          {/* Volumen recomendado */}
          <div className={`text-sm font-medium ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
            Volumen recomendado: {calculo.volumenRecomendado} ml
          </div>

          {/* Desglose */}
          {calculo.desglose.length > 0 && (
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {calculo.desglose
                .filter(d => d.volumenMl > 0)
                .map((d, idx) => (
                  <span key={d.medId}>
                    {idx > 0 && ' + '}
                    {d.medId}: {d.volumenMl} ml
                  </span>
                ))}
              {calculo.desglose.filter(d => d.volumenMl > 0).length > 1 && (
                <span> = {calculo.desglose.reduce((sum, d) => sum + d.volumenMl, 0).toFixed(1)} ml</span>
              )}
            </div>
          )}

          {/* Advertencia de capeo */}
          {calculo.fueCapado && (
            <div className={`text-xs p-2 rounded ${darkMode ? 'bg-yellow-900 bg-opacity-40 text-yellow-300' : 'bg-yellow-50 text-yellow-700'}`}>
              Ajustado por límite de seguridad: 4.5 mg/kg = {calculo.volumenMaxSeguro} ml para {pesoKg} kg
            </div>
          )}

          {/* Opción reducida si disponible */}
          {calculo.volumenReducido && (
            <div className="space-y-1 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="lidocaina-opcion"
                  checked={opcionActual === 'recomendado'}
                  onChange={() => onOpcionChange('recomendado')}
                  className="h-3.5 w-3.5"
                />
                <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Recomendado: {calculo.volumenRecomendado} ml
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="lidocaina-opcion"
                  checked={opcionActual === 'reducido'}
                  onChange={() => onOpcionChange('reducido')}
                  className="h-3.5 w-3.5"
                />
                <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Reducido: {calculo.volumenReducido} ml
                </span>
              </label>
            </div>
          )}

          {/* Info de seguridad */}
          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Dosis máxima: 4.5 mg/kg = {calculo.volumenMaxSeguro} ml
          </div>

          {/* Advertencias del cálculo */}
          {calculo.advertencias.length > 0 && (
            <div className="space-y-1">
              {calculo.advertencias.map((adv, idx) => (
                <div key={idx} className={`text-xs p-1.5 rounded ${darkMode ? 'bg-yellow-900 bg-opacity-30 text-yellow-300' : 'bg-yellow-50 text-yellow-700'}`}>
                  {adv}
                </div>
              ))}
            </div>
          )}

          {/* Notas clínicas expandibles */}
          {notasRecomendadas.length > 0 && (
            <div>
              <button
                onClick={() => setMostrarNotas(!mostrarNotas)}
                className={`text-xs flex items-center gap-1 ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${mostrarNotas ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Notas clínicas ({notasRecomendadas.length})
              </button>
              {mostrarNotas && (
                <div className={`mt-1 space-y-1 ml-4`}>
                  {notasRecomendadas.map(n => (
                    <div key={n.medId} className={`text-xs p-1.5 rounded ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      <span className="font-medium">{n.medId}: </span>
                      {n.nota}
                      {n.advertencia && (
                        <span className={`block mt-0.5 font-medium ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                          {n.advertencia}
                        </span>
                      )}
                      {n.evidencia && (
                        <span className={`ml-1 ${
                          n.evidencia === 'alta'
                            ? darkMode ? 'text-green-400' : 'text-green-600'
                            : darkMode ? 'text-yellow-400' : 'text-yellow-600'
                        }`}>
                          (Evidencia {n.evidencia})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LidocainaSyringePanel;
