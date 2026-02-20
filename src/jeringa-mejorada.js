import React from 'react';

// Componente de jeringa visual que representa visualmente los medicamentos combinados
const JeringaMejorada = ({ 
  medicamentosInfo, // Array con información de medicamentos: {id, nombre, tipoMedicamento, volumenMl, color}
  capacidadMaxima = 5, 
  darkMode = false,
  mostrarAguja = true 
}) => {
  // Calcular volumen total
  const volumenTotal = medicamentosInfo.reduce((total, med) => total + parseFloat(med.volumenMl || 0), 0);
  
  // Determinar capacidad apropiada de jeringa
  const capacidad = capacidadMaxima || 
    (volumenTotal <= 1 ? 1 : 
     volumenTotal <= 3 ? 3 : 
     volumenTotal <= 5 ? 5 : 
     volumenTotal <= 10 ? 10 : 20);
  
  // Calcular el porcentaje de llenado
  const porcentajeLlenadoTotal = Math.min((volumenTotal / capacidad) * 100, 100);
  
  // Determinar tipo de jeringa basado en la capacidad
  const getTipoJeringa = () => {
    if (capacidad <= 1) return "1ml (tuberculina)";
    if (capacidad <= 3) return "3ml";
    if (capacidad <= 5) return "5ml";
    if (capacidad <= 10) return "10ml";
    return "20ml";
  };
  
  // Obtener información de la aguja
  const getTamanoAguja = () => {
    // Por defecto para IM
    return { largo: "1.5\"", calibre: "21G" };
  };
  
  // Formatear texto de volumen
  const formatearVolumen = () => {
    return `${volumenTotal.toFixed(1)} ml`;
  };
  
  // Calcular capas de medicamentos de manera secuencial (de abajo hacia arriba)
  const capasLiquido = [];
  let acumuladoPorcentaje = 0;
  
  medicamentosInfo.forEach(med => {
    if (med.volumenMl && parseFloat(med.volumenMl) > 0) {
      const porcentaje = (parseFloat(med.volumenMl) / capacidad) * 100;
      capasLiquido.push({
        ...med,
        porcentajeAbsoluto: porcentaje,
        posicionBottom: acumuladoPorcentaje,
        altura: porcentaje
      });
      acumuladoPorcentaje += porcentaje;
    }
  });
  
  return (
    <div className={`flex flex-col items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
      <div className="relative w-24 sm:w-20 h-64 sm:h-56 mb-2">
        {/* Aguja */}
        {mostrarAguja && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-12 flex flex-col items-center">
            <div className={`w-0.5 h-8 ${darkMode ? 'bg-gray-400' : 'bg-gray-500'}`}></div>
            <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-gray-300' : 'bg-gray-400'}`}></div>
            <div className="text-xs mt-1 text-center">
              {getTamanoAguja().calibre} {getTamanoAguja().largo}
            </div>
          </div>
        )}
        
        {/* Cuerpo de la jeringa */}
        <div className={`absolute inset-x-0 top-12 bottom-6 rounded-lg overflow-hidden border-2 ${
          darkMode ? 'border-gray-400 bg-gray-700' : 'border-gray-300 bg-gray-100'
        }`}>
          {/* Escala de medición */}
          <div className="absolute inset-y-0 left-0 w-6 flex flex-col justify-between py-1 z-20">
            {[...Array(Math.ceil(capacidad) + 1)].map((_, i) => (
              <div key={i} className="relative flex items-center">
                <div className={`w-2 h-0.5 ${darkMode ? 'bg-gray-300' : 'bg-gray-500'}`}></div>
                <span className={`ml-1 text-[8px] ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {capacidad - i}
                </span>
              </div>
            ))}
          </div>
          
          {/* Capas de líquido de cada medicamento - apiladas secuencialmente */}
          <div className="absolute inset-x-0 bottom-0 w-full h-full">
            {capasLiquido.map((capa, index) => (
              <div 
                key={index}
                className="absolute w-full transition-all duration-300 ease-out"
                style={{
                  bottom: `${capa.posicionBottom}%`,
                  height: `${capa.altura}%`,
                  backgroundColor: capa.color || '#E0E0E0',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                  borderTop: index > 0 ? '1px solid rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {/* Etiqueta con el volumen en cada capa si hay espacio */}
                {capa.altura > 8 && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[7px] font-bold text-black bg-white bg-opacity-70 px-1 rounded">
                    {capa.volumenMl}ml
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Émbolo */}
        <div 
          className={`absolute inset-x-0 h-6 rounded-t-lg ${darkMode ? 'bg-gray-500' : 'bg-gray-300'}`}
          style={{ 
            top: `${12 + (100 - porcentajeLlenadoTotal) * 0.6}%` 
          }}
        >
          <div className={`absolute top-0 inset-x-1/4 h-4 -mt-4 rounded-t-lg ${darkMode ? 'bg-gray-400' : 'bg-gray-400'}`}></div>
        </div>
        
        {/* Punta */}
        <div className={`absolute inset-x-1/3 bottom-0 h-6 ${darkMode ? 'bg-gray-400' : 'bg-gray-300'} rounded-b-md`}></div>
      </div>
      
      <div className="text-center">
        <p className="text-sm font-bold">{formatearVolumen()}</p>
        <p className="text-xs mt-0.5 opacity-70">Jeringa {getTipoJeringa()}</p>
      </div>
      
      {/* Leyenda de medicamentos */}
      <div className="mt-3 text-xs">
        <p className="font-semibold mb-1 text-center">Componentes:</p>
        <div className="flex flex-col space-y-1 max-w-[200px]">
          {medicamentosInfo.map((med, idx) => (
            med.volumenMl && parseFloat(med.volumenMl) > 0 ? (
              <div key={idx} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                  style={{ backgroundColor: med.color || '#E0E0E0' }}
                ></div>
                <span className="truncate">{med.nombre} ({med.volumenMl}ml)</span>
              </div>
            ) : null
          ))}
        </div>
      </div>
    </div>
  );
};

export { JeringaMejorada };