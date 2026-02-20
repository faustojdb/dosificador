import React, { useState, useEffect } from 'react';
import { listarPresets, guardarPreset, cargarPreset, eliminarPreset, MAX_SLOTS } from './utils/presetManager';

const PresetPanel = ({ darkMode, datosActuales, onCargarPreset }) => {
  const [presets, setPresets] = useState(Array(MAX_SLOTS).fill(null));
  const [editandoNombre, setEditandoNombre] = useState(null);
  const [nombreTemp, setNombreTemp] = useState('');

  useEffect(() => {
    setPresets(listarPresets());
  }, []);

  const handleGuardar = (slot) => {
    const nombre = nombreTemp.trim() || `Preset ${slot + 1}`;
    guardarPreset(slot, {
      nombre,
      peso: datosActuales.peso,
      edad: datosActuales.edad,
      unidadEdad: datosActuales.unidadEdad,
      viaAdministracion: datosActuales.viaAdministracion,
      medicamentosSeleccionados: datosActuales.medicamentosSeleccionados,
      condicionesPaciente: datosActuales.condicionesPaciente || []
    });
    setPresets(listarPresets());
    setEditandoNombre(null);
    setNombreTemp('');
  };

  const handleCargar = (slot) => {
    const preset = cargarPreset(slot);
    if (preset && onCargarPreset) {
      onCargarPreset(preset);
    }
  };

  const handleEliminar = (slot) => {
    eliminarPreset(slot);
    setPresets(listarPresets());
  };

  const iniciarGuardado = (slot) => {
    const presetExistente = presets[slot];
    setNombreTemp(presetExistente?.nombre || '');
    setEditandoNombre(slot);
  };

  return (
    <div className="mt-6">
      <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
        Presets guardados
      </h3>
      <div className="space-y-2">
        {Array.from({ length: MAX_SLOTS }).map((_, slot) => {
          const preset = presets[slot];

          if (editandoNombre === slot) {
            return (
              <div key={slot} className={`p-2 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <input
                  type="text"
                  value={nombreTemp}
                  onChange={(e) => setNombreTemp(e.target.value)}
                  placeholder={`Nombre del preset ${slot + 1}`}
                  className={`w-full px-2 py-1 rounded text-sm mb-1 ${
                    darkMode ? 'bg-gray-600 text-white border-gray-500' : 'bg-white text-gray-900 border-gray-300'
                  } border`}
                  onKeyDown={(e) => e.key === 'Enter' && handleGuardar(slot)}
                  autoFocus
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => handleGuardar(slot)}
                    className="flex-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditandoNombre(null)}
                    className={`flex-1 px-2 py-1 text-xs rounded ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={slot} className={`flex items-center gap-1 p-2 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex-grow min-w-0">
                {preset ? (
                  <div>
                    <div className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {preset.nombre}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {preset.peso}kg, {preset.edad} {preset.unidadEdad}, {preset.medicamentosSeleccionados?.length || 0} med.
                    </div>
                  </div>
                ) : (
                  <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Slot {slot + 1} vacío
                  </span>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {preset && (
                  <button
                    onClick={() => handleCargar(slot)}
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    title="Cargar preset"
                  >
                    Cargar
                  </button>
                )}
                <button
                  onClick={() => iniciarGuardado(slot)}
                  className={`px-2 py-1 text-xs rounded ${
                    darkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title="Guardar en este slot"
                >
                  {preset ? 'Sobreescr.' : 'Guardar'}
                </button>
                {preset && (
                  <button
                    onClick={() => handleEliminar(slot)}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    title="Eliminar preset"
                  >
                    X
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PresetPanel;
