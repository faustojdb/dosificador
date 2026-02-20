import React, { useState, useEffect } from 'react';

const DiluyenteSelector = ({ 
  diluyenteActual, 
  proporciones,
  onChange,
  darkMode 
}) => {
  const [volumenPersonalizado, setVolumenPersonalizado] = useState(
    diluyenteActual?.proporcion?.volumenMl.toString() || ''
  );
  const [error, setError] = useState('');

  useEffect(() => {
    setVolumenPersonalizado(diluyenteActual?.proporcion?.volumenMl.toString() || '');
  }, [diluyenteActual]);

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
    
    // Crear una proporción personalizada
    const proporcionPersonalizada = {
      ...diluyenteActual.proporcion,
      volumenMl: volumen,
      esPersonalizado: true
    };
    
    // Notificar el cambio
    onChange(proporcionPersonalizada);
  };

  const handleSeleccionPredefinida = (proporcion) => {
    setVolumenPersonalizado(proporcion.volumenMl.toString());
    setError('');
    onChange(proporcion);
  };

  return (
    <div className="mt-2">
      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
        Volumen de diluyente (ml):
      </label>
      
      <div className="flex gap-2 mb-2">
        {proporciones.map((prop, idx) => (
          <button
            key={idx}
            onClick={() => handleSeleccionPredefinida(prop)}
            className={`px-2 py-1 text-xs rounded ${
              volumenPersonalizado === prop.volumenMl.toString()
                ? darkMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-500 text-white'
                : darkMode
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-200 text-gray-700'
            }`}
          >
            {prop.volumenMl} ml
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
        <strong>Recomendación:</strong> {diluyenteActual.comentarios}
      </div>
    </div>
  );
};

export default DiluyenteSelector;