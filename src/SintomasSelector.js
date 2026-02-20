import React, { useState } from 'react';
import { getSintomasDisponibles } from './utils/sintomasService';

const SintomasSelector = ({ darkMode, sintomasActivos, onChange }) => {
  const { grupos } = getSintomasDisponibles();
  const [gruposColapsados, setGruposColapsados] = useState({});

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
      </p>
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
                  <label
                    key={sintoma.id}
                    className={`flex items-center gap-1.5 p-1 rounded cursor-pointer text-sm transition-colors ${
                      sintomasActivos.includes(sintoma.id)
                        ? darkMode ? 'bg-purple-900 bg-opacity-40 border border-purple-700' : 'bg-purple-100 border border-purple-300'
                        : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={sintomasActivos.includes(sintoma.id)}
                      onChange={() => toggleSintoma(sintoma.id)}
                      className="rounded text-purple-500 focus:ring-purple-500 flex-shrink-0"
                    />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {sintoma.nombre}
                    </span>
                  </label>
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
