import React, { useState } from 'react';
import { getSintomasDisponibles } from './utils/sintomasService';

const SintomasSelector = ({ darkMode, sintomasActivos, onChange }) => {
  const { grupos } = getSintomasDisponibles();
  const [gruposColapsados, setGruposColapsados] = useState({});
  const [sintomaInfo, setSintomaInfo] = useState(null);

  const toggleSintoma = (id) => {
    if (sintomasActivos.includes(id)) {
      onChange(sintomasActivos.filter(s => s !== id));
    } else {
      onChange([...sintomasActivos, id]);
    }
  };

  const toggleGrupo = (grupoId) => {
    setGruposColapsados(prev => ({ ...prev, [grupoId]: !prev[grupoId] }));
  };

  return (
    <div className="mt-6">
      <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
        Síntomas del paciente
      </h3>
      <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Seleccione síntomas para sugerir cuadros clínicos y detectar alertas epidemiológicas.
        Toque el icono <span className="inline-block w-4 text-center font-bold">?</span> para ver qué significa cada síntoma.
      </p>

      {/* Tooltip de descripción */}
      {sintomaInfo && (
        <div className={`mb-2 p-2 rounded-md text-xs border ${
          darkMode ? 'bg-purple-900/40 border-purple-700 text-purple-200' : 'bg-purple-50 border-purple-300 text-purple-800'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="font-semibold">{sintomaInfo.nombre}:</span>{' '}
              {sintomaInfo.descripcion}
            </div>
            <button
              onClick={() => setSintomaInfo(null)}
              className={`ml-2 flex-shrink-0 text-xs px-1 rounded ${darkMode ? 'text-purple-400 hover:text-purple-200' : 'text-purple-600 hover:text-purple-900'}`}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {grupos.map(grupo => (
          <div key={grupo.id}>
            <button
              onClick={() => toggleGrupo(grupo.id)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm font-medium transition-colors ${
                darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{grupo.nombre}</span>
              <span className="text-xs">
                {grupo.sintomas.filter(s => sintomasActivos.includes(s.id)).length > 0 && (
                  <span className={`mr-1 px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                    {grupo.sintomas.filter(s => sintomasActivos.includes(s.id)).length}
                  </span>
                )}
                {gruposColapsados[grupo.id] ? '▶' : '▼'}
              </span>
            </button>
            {!gruposColapsados[grupo.id] && (
              <div className="ml-2 space-y-0.5">
                {grupo.sintomas.map(sintoma => (
                  <div
                    key={sintoma.id}
                    className={`flex items-center gap-1 p-1 rounded transition-colors ${
                      sintomasActivos.includes(sintoma.id)
                        ? darkMode ? 'bg-purple-900 bg-opacity-40 border border-purple-700' : 'bg-purple-100 border border-purple-300'
                        : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <label className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={sintomasActivos.includes(sintoma.id)}
                        onChange={() => toggleSintoma(sintoma.id)}
                        className="rounded text-purple-500 focus:ring-purple-500 flex-shrink-0"
                      />
                      <span className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} title={sintoma.descripcion}>
                        {sintoma.nombre}
                      </span>
                    </label>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSintomaInfo(sintomaInfo?.id === sintoma.id ? null : sintoma);
                      }}
                      className={`flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                        sintomaInfo?.id === sintoma.id
                          ? (darkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white')
                          : (darkMode ? 'bg-gray-600 text-gray-300 hover:bg-purple-700 hover:text-white' : 'bg-gray-300 text-gray-600 hover:bg-purple-400 hover:text-white')
                      }`}
                      title={sintoma.descripcion}
                    >
                      ?
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {sintomasActivos.length > 0 && (
        <button
          onClick={() => onChange([])}
          className={`mt-2 text-xs px-2 py-1 rounded ${
            darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          Limpiar síntomas ({sintomasActivos.length})
        </button>
      )}
    </div>
  );
};

export default SintomasSelector;
