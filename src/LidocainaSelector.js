import React, { useState, useEffect } from 'react';

const LidocainaSelector = ({ 
  valorActual,
  medicamento,
  onChange,
  darkMode 
}) => {
  const [volumenPersonalizado, setVolumenPersonalizado] = useState(
    valorActual?.toString() || '1.0'
  );
  const [error, setError] = useState('');
  const [mostrarSelector, setMostrarSelector] = useState(false);

  useEffect(() => {
    setVolumenPersonalizado(valorActual?.toString() || '1.0');
  }, [valorActual]);

  // Valores predefinidos según tipo de medicamento
  const getValoresPredefinidos = () => {
    if (medicamento?.id === "ceftriaxona" || medicamento?.nombre?.toLowerCase().includes('rocephin')) {
      return medicamento.concentracion <= 500 ? [0.9, 1.5, 2.0] : [1.5, 2.5, 3.5, 7.0];
    }
    
    // Valores por defecto para otros medicamentos
    return [0.5, 1.0, 2.0, 3.0];
  };

  // Recomendación según tipo de medicamento
  const getRecomendacion = () => {
    if (medicamento?.id === "ceftriaxona" || medicamento?.nombre?.toLowerCase().includes('rocephin')) {
      return "La lidocaína utilizada debe ser siempre al 1% sin epinefrina. Reduce el dolor en la inyección.";
    }
    
    if (medicamento?.tipoMedicamento?.includes("Antiinflamatorio")) {
      return "Usar lidocaína al 1% puede reducir el dolor de la inyección. Usar mínima cantidad posible.";
    }
    
    return "Usar lidocaína al 1% sin epinefrina para reducir el dolor. No recomendado en pacientes con alergia a anestésicos locales tipo amida.";
  };

  const handleVolumenChange = (e) => {
    const valor = e.target.value;
    setVolumenPersonalizado(valor);
    
    const volumen = parseFloat(valor);
    
    // Validar el volumen
    if (isNaN(volumen) || volumen <= 0) {
      setError('El volumen debe ser un número positivo');
      return;
    }
    
    if (volumen < 0.5) {
      setError('El volumen mínimo recomendado es 0.5 ml');
      return;
    }
    
    if (volumen > 10) {
      setError('El volumen máximo recomendado es 10 ml');
      return;
    }
    
    setError('');
    
    // Notificar el cambio
    onChange(volumen);
  };

  const handleSeleccionPredefinida = (volumen) => {
    setVolumenPersonalizado(volumen.toString());
    setError('');
    onChange(volumen);
  };

  return (
    <div className="mt-2">
      <div className="flex items-center mb-2 justify-between">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="usarLidocaina"
            checked={mostrarSelector}
            onChange={(e) => {
              setMostrarSelector(e.target.checked);
              if (!e.target.checked) {
                onChange(0);
              } else {
                onChange(parseFloat(volumenPersonalizado) || 1.0);
              }
            }}
            className="mr-2 h-4 w-4"
          />
          <label 
            htmlFor="usarLidocaina" 
            className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Usar lidocaína al 1%
          </label>
        </div>

        {mostrarSelector && (
          <div className={`text-xs py-1 px-2 rounded ${
            darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
          }`}>
            +{volumenPersonalizado} ml
          </div>
        )}
      </div>
      
      {mostrarSelector && (
        <>
          <div className="flex gap-2 mb-2">
            {getValoresPredefinidos().map((vol, idx) => (
              <button
                key={idx}
                onClick={() => handleSeleccionPredefinida(vol)}
                className={`px-2 py-1 text-xs rounded ${
                  parseFloat(volumenPersonalizado) === vol
                    ? darkMode 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-500 text-white'
                    : darkMode
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-200 text-gray-700'
                }`}
              >
                {vol} ml
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.1"
              value={volumenPersonalizado}
              onChange={handleVolumenChange}
              className={`block w-24 px-2 py-1 text-sm rounded-md ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            <span className="text-sm">ml</span>
          </div>
          
          {error && (
            <p className={`text-xs mt-1 ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
              {error}
            </p>
          )}
          
          <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <strong>Recomendación:</strong> {getRecomendacion()}
          </div>
        </>
      )}
    </div>
  );
};

export default LidocainaSelector;