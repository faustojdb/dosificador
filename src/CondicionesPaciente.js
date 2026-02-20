import React from 'react';
import { getCondicionesDisponibles } from './utils/ddinterService';

const CondicionesPaciente = ({ darkMode, condicionesActivas, onChange }) => {
  const condiciones = getCondicionesDisponibles();

  const toggleCondicion = (id) => {
    if (condicionesActivas.includes(id)) {
      onChange(condicionesActivas.filter(c => c !== id));
    } else {
      onChange([...condicionesActivas, id]);
    }
  };

  return (
    <div className="mt-6">
      <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
        Condiciones del paciente
      </h3>
      <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Los medicamentos contraindicados se bloquearán automáticamente.
      </p>
      <div className="grid grid-cols-1 gap-0.5">
        {condiciones.map(cond => (
          <label
            key={cond.id}
            className={`flex items-center gap-1.5 p-1.5 rounded cursor-pointer text-sm transition-colors ${
              condicionesActivas.includes(cond.id)
                ? darkMode ? 'bg-orange-900 bg-opacity-40 border border-orange-700' : 'bg-orange-100 border border-orange-300'
                : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <input
              type="checkbox"
              checked={condicionesActivas.includes(cond.id)}
              onChange={() => toggleCondicion(cond.id)}
              className="rounded text-orange-500 focus:ring-orange-500 flex-shrink-0"
            />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              {cond.label}
            </span>
          </label>
        ))}
      </div>
      {condicionesActivas.length > 0 && (
        <button
          onClick={() => onChange([])}
          className={`mt-2 text-xs px-2 py-1 rounded ${
            darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          Limpiar todas
        </button>
      )}
    </div>
  );
};

export default CondicionesPaciente;
