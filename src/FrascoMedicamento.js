import React from 'react';

// Componente para visualizar un frasco/ampolla de medicamento
const FrascoMedicamento = ({ 
  volumenMl, 
  concentracion, 
  unidadMedida, 
  medicamento, 
  darkMode,
  esPolvo = false,
  capacidadTotal = null // Capacidad total del frasco/ampolla
}) => {
  // Asegurarse de que el volumen es un número
  const volumen = parseFloat(volumenMl) || 0;
  
  // Determinar capacidad total (si no se proporciona)
  const capTotal = capacidadTotal || 
    (medicamento?.nombre?.toLowerCase().includes('rocephin') || 
     medicamento?.id === 'ceftriaxona') ? 
      (concentracion >= 1000 ? 10 : 5) : 
      (volumen <= 2 ? 2 : volumen <= 5 ? 5 : 10);
  
  // Calcular el porcentaje de llenado
  const porcentajeLlenado = Math.min((volumen / capTotal) * 100, 100);
  
  // Color del líquido según tipo de medicamento
  const getColorLiquido = () => {
    const tiposMedicamento = {
      'Analgésico y antipirético': '#FF9500', // Naranja intenso
      'Antiemético': '#00CC66', // Verde medio
      'Corticosteroide': '#F5F5DC', // Beige para que se vea en modo oscuro
      'Benzodiazepina': '#4DA6FF', // Azul medio
      'Antiinflamatorio no esteroideo': '#FF6B8A', // Rosa intenso
      'Antibiótico betalactámico': '#B266FF', // Púrpura medio
      'Antibiótico cefalosporínico': '#9370DB', // Púrpura medio-claro
      'Anestésico local tipo amida': '#AC92EC', // Púrpura claro
      'Diluyente': '#D6ECF3' // Azul muy claro para diluyentes
    };

    // Si hay un ID específico, usar colores específicos
    const coloresPorId = {
      'metamizol': '#FF9500', // Naranja intenso
      'metoclopramida': '#00CC66', // Verde medio
      'dexametasona': '#FFFACD', // Amarillo claro-limón
      'diazepam': '#4DA6FF', // Azul medio
      'diclofenac': '#FF6B8A', // Rosa intenso
      'penicilina': '#BA55D3', // Púrpura intenso
      'lorazepam': '#5D8AA8', // Azul acero
      'ketorolaco': '#FF496C', // Rosa más intenso que diclofenac
      'ceftriaxona': '#9370DB', // Púrpura medio-claro
      'lidocaina': '#AC92EC' // Púrpura claro
    };

    // Primero intentar por ID específico
    if (medicamento?.id && coloresPorId[medicamento.id]) {
      return coloresPorId[medicamento.id];
    }

    // Luego por tipo
    for (const [tipo, color] of Object.entries(tiposMedicamento)) {
      if (medicamento?.tipoMedicamento?.includes(tipo)) {
        return color;
      }
    }

    return '#70C1FF'; // Azul claro por defecto para mejor visibilidad
  };
  
  // Obtener texto para capacidad del frasco/ampolla
  // eslint-disable-next-line no-unused-vars
  const getCapacidadTexto = () => {
    if (esPolvo) return '';
    return `${capTotal}ml`;
  };
  
  if (esPolvo) {
    return (
      <div className="flex flex-col items-center">
        <div className={`w-12 h-16 rounded-lg flex items-center justify-center ${darkMode ? 'bg-gray-600' : 'bg-white'} border-2 ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}>
          <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-purple-300 bg-opacity-70' : 'bg-purple-100'} flex items-center justify-center`}>
            <span className="text-xs font-semibold text-purple-800">Polvo</span>
          </div>
        </div>
        <div className="text-center mt-1">
          <p className="text-xs font-semibold">{medicamento?.nombre || 'Medicamento'}</p>
          <p className="text-xs">{concentracion} {unidadMedida}</p>
        </div>
      </div>
    );
  }
  
  if (medicamento?.tipoMedicamento?.includes('Diluyente')) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className={`w-8 h-16 rounded-lg flex items-end justify-center ${darkMode ? 'bg-gray-600' : 'bg-white'} border-2 ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}>
            <div 
              className={`w-6 rounded-b-lg`}
              style={{ 
                height: `${porcentajeLlenado}%`, 
                backgroundColor: getColorLiquido()
              }}
            ></div>
          </div>
          <div className="absolute -right-4 top-0 h-full flex flex-col justify-between py-1 text-[7px]">
            <span>{capTotal}ml</span>
            <span>{capTotal/2}ml</span>
            <span>0ml</span>
          </div>
        </div>
        <div className="text-center mt-1">
          <p className="text-xs font-semibold">{medicamento?.nombre || 'Diluyente'}</p>
          <p className="text-xs">{volumen.toFixed(1)} ml</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className={`w-10 h-16 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'} border-2 ${darkMode ? 'border-gray-500' : 'border-gray-300'} flex flex-col justify-end overflow-hidden`}>
          <div 
            className="w-full transition-all duration-300"
            style={{ 
              height: `${porcentajeLlenado}%`,
              backgroundColor: getColorLiquido()
            }}
          ></div>
        </div>
        <div className="absolute -right-4 top-0 h-full flex flex-col justify-between py-1 text-[7px]">
          <span>{capTotal}ml</span>
          <span>{capTotal/2}ml</span>
          <span>0ml</span>
        </div>
      </div>
      <div className="text-center mt-1">
        <p className="text-xs font-semibold">{medicamento?.nombre || 'Medicamento'}</p>
        {volumen > 0 && <p className="text-xs">{volumen.toFixed(1)} ml</p>}
        {concentracion && <p className="text-xs">{concentracion} {unidadMedida || 'mg'}</p>}
      </div>
    </div>
  );
};

export { FrascoMedicamento };