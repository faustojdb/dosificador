import React from 'react';

const colorMap = {
  orange: {
    bg: 'bg-orange-600',
    bgLight: 'bg-orange-100',
    border: 'border-orange-500',
    borderLight: 'border-orange-400',
    text: 'text-orange-100',
    textLight: 'text-orange-800',
    badge: 'bg-orange-700',
    badgeLight: 'bg-orange-200'
  },
  blue: {
    bg: 'bg-blue-700',
    bgLight: 'bg-blue-100',
    border: 'border-blue-500',
    borderLight: 'border-blue-400',
    text: 'text-blue-100',
    textLight: 'text-blue-800',
    badge: 'bg-blue-800',
    badgeLight: 'bg-blue-200'
  },
  red: {
    bg: 'bg-red-700',
    bgLight: 'bg-red-100',
    border: 'border-red-500',
    borderLight: 'border-red-400',
    text: 'text-red-100',
    textLight: 'text-red-800',
    badge: 'bg-red-800',
    badgeLight: 'bg-red-200'
  },
  teal: {
    bg: 'bg-teal-700',
    bgLight: 'bg-teal-100',
    border: 'border-teal-500',
    borderLight: 'border-teal-400',
    text: 'text-teal-100',
    textLight: 'text-teal-800',
    badge: 'bg-teal-800',
    badgeLight: 'bg-teal-200'
  }
};

const AlertaEpidemiologica = ({ darkMode, alertas, medicamentosSeleccionados, onQuitarMedicamento }) => {
  if (!alertas || alertas.length === 0) return null;

  return (
    <div className="space-y-3 mb-4">
      {alertas.map(alerta => {
        const colors = colorMap[alerta.color] || colorMap.orange;
        const medsProhibidosSeleccionados = alerta.medicamentosProhibidos
          .filter(p => medicamentosSeleccionados.includes(p.id));

        return (
          <div
            key={alerta.id}
            className={`rounded-lg border-2 p-4 ${
              darkMode
                ? `${colors.bg} bg-opacity-30 ${colors.border}`
                : `${colors.bgLight} ${colors.borderLight}`
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <h3 className={`text-lg font-bold ${darkMode ? colors.text : colors.textLight}`}>
                  ALERTA: {alerta.nombre}
                </h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                darkMode ? `${colors.badge} ${colors.text}` : `${colors.badgeLight} ${colors.textLight}`
              }`}>
                {alerta.confianza}% confianza
              </span>
            </div>

            {/* Banderas rojas */}
            {alerta.banderasActivas.length > 0 && (
              <div className={`mb-3 p-2 rounded ${darkMode ? 'bg-red-900/50' : 'bg-red-50'} border ${darkMode ? 'border-red-700' : 'border-red-300'}`}>
                <p className={`text-xs font-bold mb-1 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                  BANDERAS ROJAS:
                </p>
                {alerta.banderasActivas.map((bandera, i) => (
                  <p key={i} className={`text-xs ${darkMode ? 'text-red-200' : 'text-red-600'} animate-pulse`}>
                    🔴 {bandera.mensaje}
                  </p>
                ))}
              </div>
            )}

            {/* Meds prohibidos seleccionados */}
            {medsProhibidosSeleccionados.length > 0 && (
              <div className={`mb-3 p-2 rounded ${darkMode ? 'bg-red-900/40' : 'bg-red-50'}`}>
                <p className={`text-xs font-bold mb-1 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                  MEDICAMENTOS PROHIBIDOS (actualmente seleccionados):
                </p>
                {medsProhibidosSeleccionados.map(med => (
                  <div key={med.id} className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${darkMode ? 'text-red-200' : 'text-red-600'}`}>
                      ✕ {med.id}: {med.razon}
                    </span>
                    <button
                      onClick={() => onQuitarMedicamento(med.id)}
                      className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Meds permitidos */}
            {alerta.medicamentosPermitidos.length > 0 && (
              <div className="mb-2">
                <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                  Medicamentos seguros:
                </p>
                <div className="flex flex-wrap gap-1">
                  {alerta.medicamentosPermitidos.map(medId => (
                    <span key={medId} className={`px-2 py-0.5 rounded-full text-xs ${
                      darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                    }`}>
                      {medId}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnóstico diferencial */}
            <details className="mb-1">
              <summary className={`text-xs cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Diagnóstico diferencial
              </summary>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {alerta.guiaDiferencial}
              </p>
            </details>

            {/* Conducta */}
            <details>
              <summary className={`text-xs cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Conducta a seguir
              </summary>
              <p className={`text-xs mt-1 whitespace-pre-line ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {alerta.conducta}
              </p>
            </details>
          </div>
        );
      })}
    </div>
  );
};

export default AlertaEpidemiologica;
