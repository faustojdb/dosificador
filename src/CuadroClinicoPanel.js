import React from 'react';

const CuadroClinicoPanel = ({ darkMode, cuadrosCoincidentes, medicamentosSeleccionados, getMedicamentoStatus, onAplicarRecomendacion }) => {
  if (!cuadrosCoincidentes || cuadrosCoincidentes.length === 0) return null;

  return (
    <div className={`mt-4 rounded-lg p-4 ${darkMode ? 'bg-gray-750 border border-gray-700' : 'bg-purple-50 border border-purple-200'}`}>
      <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
        Cuadros Clínicos Sugeridos
      </h3>
      <div className="space-y-3">
        {cuadrosCoincidentes.map(cuadro => {
          const porcentajeColor = cuadro.porcentaje >= 70
            ? (darkMode ? 'text-green-400' : 'text-green-600')
            : cuadro.porcentaje >= 40
              ? (darkMode ? 'text-yellow-400' : 'text-yellow-600')
              : (darkMode ? 'text-gray-400' : 'text-gray-500');

          return (
            <div
              key={cuadro.cuadroId}
              className={`p-3 rounded-md border ${
                cuadro.esEmergencia
                  ? (darkMode ? 'border-red-700 bg-red-900/20' : 'border-red-400 bg-red-50')
                  : (darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white')
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold ${
                    cuadro.esEmergencia
                      ? (darkMode ? 'text-red-400' : 'text-red-700')
                      : (darkMode ? 'text-white' : 'text-gray-900')
                  }`}>
                    {cuadro.nombre}
                  </h4>
                  <span className={`text-lg font-bold ${porcentajeColor}`}>
                    {cuadro.porcentaje}%
                  </span>
                </div>
                <button
                  onClick={() => onAplicarRecomendacion(cuadro)}
                  className={`ml-2 px-3 py-1.5 text-xs rounded font-medium flex-shrink-0 ${
                    cuadro.esEmergencia
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  Aplicar
                </button>
              </div>

              <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {cuadro.descripcion}
              </p>

              <div className="flex flex-wrap gap-1 mb-2">
                {cuadro.medicamentosRecomendados.map(med => {
                  const status = getMedicamentoStatus(med.id);
                  const esBloqueado = status === 'bloqueado' || status === 'bloqueado_condicion' || status === 'bloqueado_epidemiologico';
                  const estaSeleccionado = medicamentosSeleccionados.includes(med.id);

                  return (
                    <span
                      key={med.id}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                        esBloqueado
                          ? (darkMode ? 'bg-red-900/50 text-red-400 line-through' : 'bg-red-100 text-red-600 line-through')
                          : estaSeleccionado
                            ? (darkMode ? 'bg-blue-800 text-blue-300' : 'bg-blue-100 text-blue-700')
                            : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                      }`}
                      title={`${med.rol}${esBloqueado ? ' (bloqueado)' : ''}`}
                    >
                      {med.id} - {med.rol}
                      {esBloqueado && ' ✕'}
                    </span>
                  );
                })}
              </div>

              {cuadro.notasClinicas && (
                <p className={`text-xs italic ${
                  cuadro.esEmergencia
                    ? (darkMode ? 'text-red-300' : 'text-red-600')
                    : (darkMode ? 'text-yellow-400' : 'text-yellow-700')
                }`}>
                  {cuadro.notasClinicas}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CuadroClinicoPanel;
