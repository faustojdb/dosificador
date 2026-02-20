import React, { useState, useEffect, useMemo } from 'react';
import Switch from './switch-component';
import { JeringaMejorada } from './jeringa-mejorada';
import { FrascoMedicamento } from './FrascoMedicamento';
import DiluyenteSelector from './DiluyenteSelector';
import LidocainaSyringePanel from './LidocainaSelector';
import medicamentosData from './medicamentosData.json';
import { calcularDosisEstructurada } from './utils/calcularDosisEstructurada';
import { getSnapInfo } from './utils/snapGrid';
import { evaluarCompatibilidadLidocaina, calcularVolumenLidocaina, obtenerNotasClinicas } from './utils/lidocainaService';
import PresetPanel from './PresetPanel';
import CondicionesPaciente from './CondicionesPaciente';
import { buscarTodasInteracciones, getEstadoPorCondiciones } from './utils/ddinterService';
import FdaInfoPanel from './FdaInfoPanel';

// Componente principal
const App = () => {
  // Estados para datos del paciente
  const [peso, setPeso] = useState(70);
  const [edad, setEdad] = useState(30);
  const [unidadEdad, setUnidadEdad] = useState("años");

  // Cálculo de edad en meses para facilitar comparaciones
  const edadEnMeses = useMemo(() => unidadEdad === "años" ? edad * 12 : edad, [edad, unidadEdad]);
  const [darkMode, setDarkMode] = useState(false);
  const [viaAdministracion, setViaAdministracion] = useState("IM");
  
  // Estado para medicamentos seleccionados
  const [medicamentosSeleccionados, setMedicamentosSeleccionados] = useState([]);
  
  // Estados para resultados
  const [dosisCalculadas, setDosisCalculadas] = useState({});
  const [interacciones, setInteracciones] = useState([]);
  const [condicionesIdentificadas, setCondicionesIdentificadas] = useState([]);
  const [medicamentoDetalle, setMedicamentoDetalle] = useState(null);
  const [mostrarMaestroDetalle, setMostrarMaestroDetalle] = useState(false);
  const [presentacionSeleccionada, setPresentacionSeleccionada] = useState({});

  // Estado para condiciones del paciente (Fase 4: DDInter)
  const [condicionesPaciente, setCondicionesPaciente] = useState([]);
  const [alertasDrogaEnfermedad, setAlertasDrogaEnfermedad] = useState([]);
  
  // Extraer datos del JSON
  const {
    medicamentos,
    interaccionesPeligrosas,
    interaccionesPediatricasEspeciales,
    mezclasCompatibilidad,
    combinacionesComunes,
    pautasPediatricasEspeciales,
    dilucionesEspeciales
  } = medicamentosData;

  // Estado para diluyentes seleccionados
  const [diluyentesSeleccionados, setDiluyentesSeleccionados] = useState({});

  // Estado para lidocaína a nivel de jeringa
  const [lidocainaActiva, setLidocainaActiva] = useState(false);
  const [lidocainaOpcion, setLidocainaOpcion] = useState('recomendado');

  // Actualizar cálculos cuando cambien los datos relevantes
  useEffect(() => {
    // Calcular dosis para cada medicamento seleccionado
    const nuevasDosis = {};

    medicamentosSeleccionados.forEach(medId => {
      nuevasDosis[medId] = calcularDosis(medId, peso, edad, unidadEdad, viaAdministracion,
        presentacionSeleccionada[medId]);
    });

    setDosisCalculadas(nuevasDosis);

    // Verificar interacciones entre medicamentos
    setInteracciones(verificarInteracciones(medicamentosSeleccionados));

    // Identificar posibles condiciones tratadas
    setCondicionesIdentificadas(identificarCondiciones(medicamentosSeleccionados));

    // Fase 4: Detectar interacciones droga-enfermedad
    setAlertasDrogaEnfermedad(buscarTodasInteracciones(medicamentosSeleccionados, condicionesPaciente));

    // Auto-deseleccionar medicamentos bloqueados por condiciones del paciente
    if (condicionesPaciente.length > 0) {
      const medsARemover = medicamentosSeleccionados.filter(medId =>
        getEstadoPorCondiciones(medId, condicionesPaciente) === 'bloqueado'
      );
      if (medsARemover.length > 0) {
        setMedicamentosSeleccionados(prev => prev.filter(id => !medsARemover.includes(id)));
      }
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicamentosSeleccionados, peso, edad, unidadEdad, viaAdministracion, presentacionSeleccionada, condicionesPaciente]);

  // Evaluación automática de lidocaína a nivel de jeringa
  const lidocainaEvaluacion = useMemo(() => {
    if (viaAdministracion !== "IM" || medicamentosSeleccionados.length === 0) {
      return { compatibilidad: { disponible: false, razones: [], resumen: '' }, calculo: null, notas: [] };
    }
    const compatibilidad = evaluarCompatibilidadLidocaina(
      medicamentosSeleccionados, peso, edadEnMeses, condicionesPaciente
    );
    const calculo = compatibilidad.disponible
      ? calcularVolumenLidocaina(medicamentosSeleccionados, dosisCalculadas, peso, edadEnMeses)
      : null;
    const notas = obtenerNotasClinicas(medicamentosSeleccionados);
    return { compatibilidad, calculo, notas };
  }, [medicamentosSeleccionados, dosisCalculadas, peso, edadEnMeses, condicionesPaciente, viaAdministracion]);

  // Volumen activo de lidocaína derivado de la evaluación
  const lidocainaVolumenActual = useMemo(() => {
    if (!lidocainaActiva || !lidocainaEvaluacion.calculo) return 0;
    return lidocainaOpcion === 'reducido' && lidocainaEvaluacion.calculo.volumenReducido
      ? lidocainaEvaluacion.calculo.volumenReducido
      : lidocainaEvaluacion.calculo.volumenRecomendado;
  }, [lidocainaActiva, lidocainaOpcion, lidocainaEvaluacion]);

  // Auto-desactivar lidocaína si cambia la compatibilidad
  useEffect(() => {
    if (!lidocainaEvaluacion.compatibilidad.disponible) {
      setLidocainaActiva(false);
    }
  }, [lidocainaEvaluacion.compatibilidad.disponible]);

  // Obtener presentación principal del medicamento
  const getPresentacionPrincipal = (medicamentoId) => {
    const med = medicamentos.find(m => m.id === medicamentoId);
    if (!med || !med.presentacionesComerciales || med.presentacionesComerciales.length === 0) {
      return null;
    }
    
    return med.presentacionesComerciales.find(p => p.principal) || med.presentacionesComerciales[0];
  };
  
  // Calcular dosis para un paciente específico
  const calcularDosis = (medicamentoId, peso, edad, unidadEdad, via, presentacionElegida) => {
    const medicamento = medicamentos.find(m => m.id === medicamentoId);

    if (!medicamento) return { mensaje: "Medicamento no encontrado" };

    // Obtener la presentación comercial
    const presentacion = presentacionElegida || getPresentacionPrincipal(medicamentoId);
    if (!presentacion) {
      return { mensaje: "Error: Presentación comercial no disponible" };
    }

    // Intentar cálculo con datos estructurados (Fase 1)
    const edadMesesCalc = unidadEdad === "años" ? edad * 12 : edad;
    const resultadoEstructurado = calcularDosisEstructurada(medicamento, peso, edadMesesCalc, via, presentacion);
    if (resultadoEstructurado) {
      return resultadoEstructurado;
    }

    // Fallback: cálculo con regex (código original)
    // Verificar si el medicamento se puede administrar por esta vía
    if (medicamento.viasAdministracion && !medicamento.viasAdministracion.some(v => v.includes(via))) {
      return {
        mensaje: `ADVERTENCIA: No recomendado por vía ${via}`,
        contraindicado: true,
        razon: `Solo administrar por ${medicamento.viasAdministracion.join(", ")}`
      };
    }
    
    // Verificar contraindicaciones por edad
    if (medicamento.dosisNinos.contraindicado) {
      if (unidadEdad === "meses" && medicamento.dosisNinos.contraindicado.includes("Menores de ") && 
          Number(medicamento.dosisNinos.contraindicado.split("Menores de ")[1].split(" ")[0]) > edad) {
        return { 
          mensaje: `CONTRAINDICADO: ${medicamento.dosisNinos.contraindicado}`,
          contraindicado: true 
        };
      }
      
      if (unidadEdad === "años" && medicamento.dosisNinos.contraindicado.includes("Menores de ") &&
          Number(medicamento.dosisNinos.contraindicado.split("Menores de ")[1].split(" ")[0]) > edad * 12) {
        return { 
          mensaje: `CONTRAINDICADO: ${medicamento.dosisNinos.contraindicado}`,
          contraindicado: true 
        };
      }
    }
    
    // Si es adulto (mayor de 18 años)
    if (unidadEdad === "años" && edad >= 18) {
      // Para adultos, algunos medicamentos ajustan por peso
      if (medicamentoId === "diazepam" && medicamento.usos.includes("convulsiones")) {
        const dosisMg = peso * 0.2; // 0.2 mg/kg
        const dosisMax = 10; // máximo 10 mg
        const dosisFinal = Math.min(dosisMg, dosisMax);
        
        // Calcular volumen en base a la presentación comercial
        const volumenMl = (dosisFinal / presentacion.concentracion) * presentacion.volumenMl;
        
        return {
          mensaje: `Dosis adulto: ${dosisFinal.toFixed(1)} mg ${via}`,
          explicacion: medicamento.dosisAdultos,
          adulto: true,
          volumenMl: volumenMl.toFixed(1),
          dosisCalculada: dosisFinal.toFixed(1),
          unidad: "mg",
          presentacion
        };
      }
      
      // Adulto mayor (>65 años) requiere ajuste de dosis
      if (edad > 65) {
        // Reducir dosis estándar en 30-50%
        const factorReduccion = 0.6; // 40% de reducción
        const concentracionPorMl = presentacion.concentracion / presentacion.volumenMl;
        
        // Para medicamentos con dosis específicas para ancianos
        let dosisMg = 0;
        let volumenMl = 0;
        
        if (medicamentoId === "ketorolaco") {
          dosisMg = 15; // Reducido de 30mg
          volumenMl = dosisMg / concentracionPorMl;
        } else if (medicamentoId === "metamizol") {
          dosisMg = 500; // Reducido de 1000mg
          volumenMl = dosisMg / concentracionPorMl;
        } else {
          // Si no hay dosis específica, usar presentación estándar con factor de reducción
          volumenMl = presentacion.volumenMl * factorReduccion;
          dosisMg = presentacion.concentracion * factorReduccion;
        }
        
        return {
          mensaje: `Dosis adulto mayor: reducida 40%`,
          explicacion: `${dosisMg.toFixed(0)} ${presentacion.unidad} (${volumenMl.toFixed(1)} ml)`,
          adulto: true,
          precaucion: true,
          volumenMl: volumenMl.toFixed(1),
          dosisCalculada: dosisMg.toFixed(0),
          unidad: presentacion.unidad,
          presentacion
        };
      }
      
      // Adulto estándar - usar presentación comercial completa
      return {
        mensaje: `Dosis adulto estándar`,
        explicacion: `${presentacion.concentracion} ${presentacion.unidad} (${presentacion.volumenMl} ml)`,
        adulto: true,
        volumenMl: presentacion.volumenMl,
        dosisCalculada: presentacion.concentracion,
        unidad: presentacion.unidad,
        presentacion
      };
    }
    
    // Para niños
    if (medicamento.dosisNinos.dosis.length === 0) {
      return { 
        mensaje: "No hay dosificación pediátrica disponible para este medicamento",
        contraindicado: true
      };
    }
    
    // Convertir edad a meses para comparación
    const edadEnMeses = unidadEdad === "años" ? edad * 12 : edad;
    
    // Buscar dosis apropiada según edad
    for (const dosisPediatrica of medicamento.dosisNinos.dosis) {
      const edadMinMeses = dosisPediatrica.unidad === "años" ? dosisPediatrica.edadMin * 12 : dosisPediatrica.edadMin;
      const edadMaxMeses = dosisPediatrica.unidad === "años" ? dosisPediatrica.edadMax * 12 : dosisPediatrica.edadMax;
      
      if (edadEnMeses >= edadMinMeses && edadEnMeses <= edadMaxMeses) {
        // Si la dosis está en mg/kg
        if (dosisPediatrica.cantidad.includes("mg/kg")) {
          const regexMgKg = /(\d+(\.\d+)?)-?(\d+(\.\d+)?)?/;
          const matches = dosisPediatrica.cantidad.match(regexMgKg);

          if (matches) {
            const dosisMin = Number(matches[1]);
            const dosisMax = matches[3] ? Number(matches[3]) : dosisMin;

            // Usamos el punto medio del rango para calcular
            const dosisMgKg = (dosisMin + dosisMax) / 2;
            let dosisFinal = dosisMgKg * peso;

            // Extraer unidad y frecuencia
            const unidadMatch = dosisPediatrica.cantidad.match(/mg\/kg cada (\d+) horas/);
            const frecuencia = unidadMatch ? `cada ${unidadMatch[1]} horas` : "";

            // Extraer valor máximo si existe
            const maxMatch = dosisPediatrica.cantidad.match(/máximo\s+(\d+)\s+mg/i);
            if (maxMatch) {
              const maxDosis = Number(maxMatch[1]);
              if (!isNaN(maxDosis) && dosisFinal > maxDosis) {
                dosisFinal = maxDosis;
              }
            }

            // Calcular volumen en base a la presentación comercial
            const concentracionPorMl = presentacion.concentracion / presentacion.volumenMl;
            const volumenMl = dosisFinal / concentracionPorMl;

            // Extraer vía de administración
            const viaMatch = dosisPediatrica.cantidad.match(/(IM|IV)/g);
            const viaTexto = viaMatch ? viaMatch.join(" o ") : "";
            
            return {
              mensaje: `Dosis: ${dosisFinal.toFixed(1)} mg ${viaTexto} ${frecuencia}`,
              explicacion: `${dosisFinal.toFixed(1)} mg (${volumenMl.toFixed(1)} ml)`,
              adulto: false,
              contraindicado: false,
              volumenMl: volumenMl.toFixed(1),
              dosisCalculada: dosisFinal.toFixed(1),
              unidad: "mg",
              presentacion
            };
          }
        }
        
        // Si es UI/kg (para penicilina)
        if (dosisPediatrica.cantidad.includes("UI/kg")) {
          const regexUIKg = /(\d+(\.\d+)?)/;
          const matches = dosisPediatrica.cantidad.match(regexUIKg);
          
          if (matches) {
            const dosis = Number(matches[1]);
            const dosisFinal = dosis * peso;
            
            // Calcular volumen en base a la presentación comercial
            const concentracionPorMl = presentacion.concentracion / presentacion.volumenMl;
            const volumenMl = dosisFinal / concentracionPorMl;
            
            // Formatear la dosis con separadores de miles
            const dosisFormateada = dosisFinal.toLocaleString();
            
            return {
              mensaje: `Dosis: ${dosisFormateada} UI`,
              explicacion: `${dosisFormateada} UI (${volumenMl.toFixed(1)} ml)`,
              adulto: false,
              contraindicado: false,
              volumenMl: volumenMl.toFixed(1),
              dosisCalculada: dosisFinal,
              unidad: "UI",
              presentacion
            };
          }
        }
        
        // Si no encontramos patrón específico, devolvemos el texto exacto
        return {
          mensaje: `Dosis pediátrica: según indicación`,
          explicacion: dosisPediatrica.cantidad,
          adulto: false,
          contraindicado: false,
          volumenMl: "Consultar",
          presentacion
        };
      }
    }
    
    return { 
      mensaje: "No hay dosificación específica para esta edad",
      contraindicado: true
    };
  };

  // Verificar interacciones entre medicamentos
  const verificarInteracciones = (medicamentosSeleccionados) => {
    if (!medicamentosSeleccionados || medicamentosSeleccionados.length < 2) {
      return [];
    }

    const interacciones = [];
    const esPacientePediatrico = unidadEdad === "años" ? edad < 18 : true;
    const edadEnMeses = unidadEdad === "años" ? edad * 12 : edad;

    // Comprobar cada par de medicamentos seleccionados
    for (let i = 0; i < medicamentosSeleccionados.length; i++) {
      for (let j = i + 1; j < medicamentosSeleccionados.length; j++) {
        const med1 = medicamentosSeleccionados[i];
        const med2 = medicamentosSeleccionados[j];

        // Buscar esta combinación en interacciones peligrosas
        const interaccion = interaccionesPeligrosas.find(item =>
          (item.medicamentos.includes(med1) && item.medicamentos.includes(med2))
        );

        // Comprobar si existe una interacción pediátrica especial
        const interaccionPediatrica = esPacientePediatrico ?
          interaccionesPediatricasEspeciales.find(item =>
            (item.medicamentos.includes(med1) && item.medicamentos.includes(med2))
          ) : null;

        // Si hay interacción pediátrica especial para esta edad, la utilizamos con prioridad
        if (interaccionPediatrica && esPacientePediatrico) {
          // Determinar el nivel de interacción según la edad
          const grupoEdad = interaccionPediatrica.gruposEdad.find(grupo => {
            const grupoEdadMinMeses = grupo.unidad === "años" ? grupo.edadMin * 12 : grupo.edadMin;
            const grupoEdadMaxMeses = grupo.unidad === "años" ? grupo.edadMax * 12 : grupo.edadMax;
            return edadEnMeses >= grupoEdadMinMeses && edadEnMeses <= grupoEdadMaxMeses;
          });

          if (grupoEdad) {
            interacciones.push({
              medicamentos: [med1, med2],
              nombre: `${medicamentos.find(m => m.id === med1).nombre} + ${medicamentos.find(m => m.id === med2).nombre}`,
              nivel: grupoEdad.nivel,
              descripcion: interaccionPediatrica.descripcion,
              consejos: interaccionPediatrica.consejos,
              pediatrica: true
            });
          }
        }
        // Si no hay interacción pediátrica específica pero hay una interacción general
        else if (interaccion) {
          interacciones.push({
            medicamentos: [med1, med2],
            nombre: `${medicamentos.find(m => m.id === med1).nombre} + ${medicamentos.find(m => m.id === med2).nombre}`,
            nivel: interaccion.nivel,
            descripcion: interaccion.descripcion,
            consejos: interaccion.consejos,
            pediatrica: false
          });
        }

        // Comprobar compatibilidad en mezclas
        const mezclaInfo = mezclasCompatibilidad.find(
          m => (m.medicamento1 === med1 && m.medicamento2 === med2) ||
               (m.medicamento1 === med2 && m.medicamento2 === med1)
        );

        if (mezclaInfo && esPacientePediatrico) {
          // Si hay límites por edad, verificar el nivel de compatibilidad para esta edad
          if (mezclaInfo.limitesEdad) {
            const limiteEdad = mezclaInfo.limitesEdad.find(limite => {
              const limiteEdadMinMeses = limite.unidad === "años" ? limite.edadMin * 12 : limite.edadMin;
              const limiteEdadMaxMeses = limite.unidad === "años" ? limite.edadMax * 12 : limite.edadMax;
              return edadEnMeses >= limiteEdadMinMeses && edadEnMeses <= limiteEdadMaxMeses;
            });

            if (limiteEdad && limiteEdad.compatibilidad !== "compatible") {
              // Solo agregamos si es una precaución o contraindicación
              interacciones.push({
                medicamentos: [med1, med2],
                nombre: `${medicamentos.find(m => m.id === med1).nombre} + ${medicamentos.find(m => m.id === med2).nombre}`,
                nivel: limiteEdad.compatibilidad,
                descripcion: `Mezclado: ${mezclaInfo.comentarioPediatrico}`,
                consejos: mezclaInfo.comentarioPediatrico,
                mezcla: true,
                pediatrica: true
              });
            }
          }
          // Si no hay límites pero la compatibilidad pediátrica no es "compatible"
          else if (mezclaInfo.compatibilidadPediatrica !== "compatible") {
            interacciones.push({
              medicamentos: [med1, med2],
              nombre: `${medicamentos.find(m => m.id === med1).nombre} + ${medicamentos.find(m => m.id === med2).nombre}`,
              nivel: mezclaInfo.compatibilidadPediatrica,
              descripcion: `Mezclado: ${mezclaInfo.comentarioPediatrico}`,
              consejos: mezclaInfo.comentarioPediatrico,
              mezcla: true,
              pediatrica: true
            });
          }
        }
      }
    }

    // Eliminar duplicados basados en los mismos medicamentos y mismo nivel
    const interaccionesUnicas = interacciones.reduce((acc, current) => {
      const isDuplicate = acc.some(item =>
        item.medicamentos.sort().join() === current.medicamentos.sort().join() &&
        item.nivel === current.nivel
      );

      if (!isDuplicate) {
        return [...acc, current];
      }

      return acc;
    }, []);

    return interaccionesUnicas;
  };

  // Identificar posibles condiciones basadas en medicamentos seleccionados
  const identificarCondiciones = (medicamentosSeleccionados) => {
    if (!medicamentosSeleccionados || medicamentosSeleccionados.length < 2) {
      return [];
    }
    
    const condicionesCoincidentes = [];
    
    for (const combo of combinacionesComunes) {
      // Verificar si todos los medicamentos del combo están seleccionados
      const todosIncluidos = combo.medicamentos.every(med => 
        medicamentosSeleccionados.includes(med)
      );
      
      // Verificar si al menos hay 2 medicamentos coincidentes
      const medicamentosCoincidentes = combo.medicamentos.filter(med => 
        medicamentosSeleccionados.includes(med)
      );
      
      if (medicamentosCoincidentes.length >= 2) {
        condicionesCoincidentes.push({
          ...combo,
          coincidencia: todosIncluidos ? "completa" : "parcial",
          medicamentosCoincidentes
        });
      }
    }
    
    return condicionesCoincidentes;
  };
  
  // Función para alternar la selección de un medicamento
  const toggleMedicamento = (id) => {
    // Verificar si hay interacciones peligrosas
    const medExistentes = [...medicamentosSeleccionados];

    if (medExistentes.includes(id)) {
      // Si ya está seleccionado, lo quitamos
      setMedicamentosSeleccionados(medExistentes.filter(m => m !== id));

      // Si quitamos un medicamento que requiere diluyente, eliminamos su diluyente
      if (diluyentesSeleccionados[id]) {
        setDiluyentesSeleccionados(prev => {
          const nuevos = { ...prev };
          delete nuevos[id];
          return nuevos;
        });
      }

      return;
    }

    // Verificar bloqueo por condiciones del paciente
    const estadoCondicion = getEstadoPorCondiciones(id, condicionesPaciente);
    if (estadoCondicion === 'bloqueado') {
      const medData = medicamentos.find(m => m.id === id);
      alert(`No se puede seleccionar ${medData?.nombre || id}: contraindicado por condición del paciente.`);
      return;
    }

    // Verificar si hay interacciones que bloqueen la selección
    for (const medExistente of medExistentes) {
      const interaccion = interaccionesPeligrosas.find(item =>
        item.nivel === "peligrosa" &&
        ((item.medicamentos.includes(id) && item.medicamentos.includes(medExistente)))
      );

      if (interaccion) {
        // Hay una interacción peligrosa, no permitimos la selección
        alert(`No se puede seleccionar este medicamento: ${interaccion.descripcion}`);
        return;
      }
    }

    // Si llegamos aquí, no hay interacciones peligrosas
    setMedicamentosSeleccionados([...medExistentes, id]);

    // Establecer presentación comercial por defecto
    const med = medicamentos.find(m => m.id === id);
    if (med && med.presentacionesComerciales && med.presentacionesComerciales.length > 0) {
      const presentacionPrincipal = med.presentacionesComerciales.find(p => p.principal) ||
                                   med.presentacionesComerciales[0];

      setPresentacionSeleccionada(prev => ({
        ...prev,
        [id]: presentacionPrincipal
      }));

      // Para ceftriaxona o Rocephin (mismo medicamento, distintos nombres), seleccionar automáticamente el diluyente apropiado
      if (id === "ceftriaxona" || med.nombre.toLowerCase().includes('rocephin')) {
        const dilucionInfo = dilucionesEspeciales.find(d => d.medicamento === "ceftriaxona");
        if (dilucionInfo) {
          // Determinar qué diluyente usar basado en la edad
          const diluyenteAdecuado = dilucionInfo.diluyentes.find(dil => {
            const edadMinimaEnMeses = dil.unidadEdadMinima === "años" ?
                                      dil.edadMinima * 12 : dil.edadMinima;
            return edadEnMeses >= edadMinimaEnMeses &&
                  dil.paraAdministracionIM &&
                  viaAdministracion === "IM";
          }) || dilucionInfo.diluyentes[0];

          // Buscar la proporción adecuada basada en la dosis seleccionada
          const dosisCeftriaxona = presentacionPrincipal.concentracion;
          const proporcionAdecuada = diluyenteAdecuado.proporciones.find(prop =>
            prop.dosis === dosisCeftriaxona
          ) || diluyenteAdecuado.proporciones[0];

          // Guardar la información del diluyente
          setDiluyentesSeleccionados(prev => ({
            ...prev,
            [id]: {
              ...diluyenteAdecuado,
              proporcion: proporcionAdecuada
            }
          }));
        }
      }

      // Para penicilina benzatínica, seleccionar automáticamente el diluyente apropiado
      if (id === "penicilina" || med.nombre.toLowerCase().includes('penicilina benzat')) {
        const dilucionInfo = dilucionesEspeciales.find(d => d.medicamento === "penicilina");
        if (dilucionInfo) {
          // Determinar qué diluyente usar basado en la edad
          const diluyenteAdecuado = dilucionInfo.diluyentes.find(dil => {
            if (dil.nombre === "lidocaina") {
              // Lidocaína solo para mayores de 1 año
              const edadMinimaEnMeses = dil.unidadEdadMinima === "años" ?
                                        dil.edadMinima * 12 : dil.edadMinima;
              return edadEnMeses >= edadMinimaEnMeses &&
                    dil.paraAdministracionIM &&
                    viaAdministracion === "IM";
            } else {
              // Agua para inyectables para menores de 1 año
              const edadMaximaEnMeses = dil.unidadEdadMaxima === "años" ?
                                       dil.edadMaxima * 12 : dil.edadMaxima;
              return edadEnMeses <= edadMaximaEnMeses &&
                    dil.paraAdministracionIM &&
                    viaAdministracion === "IM";
            }
          });

          if (diluyenteAdecuado) {
            // Buscar la proporción adecuada basada en la dosis seleccionada
            const dosisPenicilina = presentacionPrincipal.concentracion;
            const proporcionAdecuada = diluyenteAdecuado.proporciones.find(prop =>
              prop.dosis === dosisPenicilina
            ) || diluyenteAdecuado.proporciones[0];

            // Guardar la información del diluyente
            setDiluyentesSeleccionados(prev => ({
              ...prev,
              [id]: {
                ...diluyenteAdecuado,
                proporcion: proporcionAdecuada
              }
            }));
          }
        }
      }
    }
  };
  
  // Función para obtener el estado de un medicamento
  const getMedicamentoStatus = (id) => {
    // Verificar bloqueo por condiciones del paciente (Fase 4 mejorada)
    const estadoCondicion = getEstadoPorCondiciones(id, condicionesPaciente);
    if (estadoCondicion === 'bloqueado') {
      return "bloqueado_condicion";
    }

    if (medicamentosSeleccionados.includes(id)) {
      return "seleccionado";
    }

    // Precaución por condición (pero no bloqueo total)
    let precaucionCondicion = estadoCondicion === 'precaucion';

    const esPacientePediatrico = unidadEdad === "años" ? edad < 18 : true;
    const edadEnMeses = unidadEdad === "años" ? edad * 12 : edad;

    // Primero verificamos interacciones pediátricas si es un paciente pediátrico
    if (esPacientePediatrico) {
      for (const medSeleccionado of medicamentosSeleccionados) {
        // Buscar interacción pediátrica
        const interaccionPediatrica = interaccionesPediatricasEspeciales.find(i =>
          i.medicamentos.includes(id) && i.medicamentos.includes(medSeleccionado)
        );

        if (interaccionPediatrica) {
          // Determinar el nivel de interacción según la edad
          const grupoEdad = interaccionPediatrica.gruposEdad.find(grupo => {
            const grupoEdadMinMeses = grupo.unidad === "años" ? grupo.edadMin * 12 : grupo.edadMin;
            const grupoEdadMaxMeses = grupo.unidad === "años" ? grupo.edadMax * 12 : grupo.edadMax;
            return edadEnMeses >= grupoEdadMinMeses && edadEnMeses <= grupoEdadMaxMeses;
          });

          if (grupoEdad) {
            if (grupoEdad.nivel === "contraindicado" || grupoEdad.nivel === "peligrosa") {
              return "bloqueado";
            } else if (grupoEdad.nivel === "precaucion") {
              return "precaucion";
            }
          }
        }

        // Verificar compatibilidad de mezclas en paciente pediátrico
        const mezclaInfo = mezclasCompatibilidad.find(
          m => (m.medicamento1 === id && m.medicamento2 === medSeleccionado) ||
               (m.medicamento1 === medSeleccionado && m.medicamento2 === id)
        );

        if (mezclaInfo) {
          if (mezclaInfo.limitesEdad) {
            const limiteEdad = mezclaInfo.limitesEdad.find(limite => {
              const limiteEdadMinMeses = limite.unidad === "años" ? limite.edadMin * 12 : limite.edadMin;
              const limiteEdadMaxMeses = limite.unidad === "años" ? limite.edadMax * 12 : limite.edadMax;
              return edadEnMeses >= limiteEdadMinMeses && edadEnMeses <= limiteEdadMaxMeses;
            });

            if (limiteEdad) {
              if (limiteEdad.compatibilidad === "contraindicado" || limiteEdad.compatibilidad === "peligrosa") {
                return "bloqueado";
              } else if (limiteEdad.compatibilidad === "precaucion") {
                return "precaucion";
              }
            }
          } else if (mezclaInfo.compatibilidadPediatrica === "contraindicado" || mezclaInfo.compatibilidadPediatrica === "peligrosa") {
            return "bloqueado";
          } else if (mezclaInfo.compatibilidadPediatrica === "precaucion") {
            return "precaucion";
          }
        }
      }
    }

    // Si no hay interacciones pediátricas o no es paciente pediátrico, verificamos interacciones generales

    // Verificar si hay alguna interacción peligrosa que lo bloquee
    for (const medSeleccionado of medicamentosSeleccionados) {
      const interaccion = interaccionesPeligrosas.find(i =>
        i.nivel === "peligrosa" &&
        i.medicamentos.includes(id) &&
        i.medicamentos.includes(medSeleccionado)
      );

      if (interaccion) {
        return "bloqueado";
      }
    }

    // Verificar si hay alguna interacción de precaución
    for (const medSeleccionado of medicamentosSeleccionados) {
      const interaccion = interaccionesPeligrosas.find(i =>
        i.nivel === "precaucion" &&
        i.medicamentos.includes(id) &&
        i.medicamentos.includes(medSeleccionado)
      );

      if (interaccion) {
        return "precaucion";
      }
    }

    if (precaucionCondicion) {
      return "precaucion";
    }

    return "disponible";
  };

  // Abrir panel de detalles para un medicamento
  const abrirDetalles = (med) => {
    setMedicamentoDetalle(med);
    setMostrarMaestroDetalle(true);
  };

  // Cerrar panel de detalles
  const cerrarDetalles = () => {
    setMostrarMaestroDetalle(false);
    setTimeout(() => setMedicamentoDetalle(null), 300);
  };

  // Cargar preset guardado (Fase 3)
  const cargarPreset = (preset) => {
    if (preset.peso) setPeso(preset.peso);
    if (preset.edad) setEdad(preset.edad);
    if (preset.unidadEdad) setUnidadEdad(preset.unidadEdad);
    if (preset.viaAdministracion) setViaAdministracion(preset.viaAdministracion);
    if (preset.medicamentosSeleccionados) setMedicamentosSeleccionados(preset.medicamentosSeleccionados);
    if (preset.condicionesPaciente) setCondicionesPaciente(preset.condicionesPaciente);
  };

  // Cambiar la presentación comercial seleccionada
  const cambiarPresentacion = (medId, nuevaPresentacion) => {
    setPresentacionSeleccionada(prev => ({
      ...prev,
      [medId]: nuevaPresentacion
    }));

    // Si es ceftriaxona/Rocephin, actualizar el diluyente según la nueva presentación
    if ((medId === "ceftriaxona" || medicamentos.find(m => m.id === medId)?.nombre.toLowerCase().includes('rocephin')) && diluyentesSeleccionados[medId]) {
      const dilucionInfo = dilucionesEspeciales.find(d => d.medicamento === "ceftriaxona");
      if (dilucionInfo) {
        const diluyenteActual = diluyentesSeleccionados[medId];

        // Buscar la proporción adecuada basada en la dosis seleccionada
        const dosisCeftriaxona = nuevaPresentacion.concentracion;
        const proporcionAdecuada = diluyenteActual.proporciones.find(prop =>
          prop.dosis === dosisCeftriaxona
        ) || diluyenteActual.proporciones[0];

        // Actualizar la información del diluyente
        setDiluyentesSeleccionados(prev => ({
          ...prev,
          [medId]: {
            ...prev[medId],
            proporcion: proporcionAdecuada
          }
        }));
      }
    }
  };

  // Mostrar vías alternativas para un medicamento
  const mostrarViasAlternativas = (medId) => {
    const medicamento = medicamentos.find(m => m.id === medId);
    if (!medicamento || !medicamento.viasAlternativas || medicamento.viasAlternativas.length === 0) {
      return null;
    }
    
    return (
      <div className="mt-2 space-y-1">
        <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Vías alternativas:
        </h4>
        <div className="flex flex-wrap gap-2">
          {medicamento.viasAlternativas.map((via, idx) => (
            <span 
              key={idx} 
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                darkMode 
                  ? 'bg-blue-900 text-blue-200'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {via.via}: {via.formato}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Obtener capacidad de jeringa recomendada
  const getCapacidadJeringaRecomendada = (volumenMl) => {
    // Si no hay volumen, usar jeringa de 5ml por defecto
    if (!volumenMl || volumenMl === "Consultar") return 5;

    const vol = parseFloat(volumenMl);

    if (vol <= 1) return 1;
    if (vol <= 3) return 3;
    if (vol <= 5) return 5;
    if (vol <= 10) return 10;
    return 20; // Para volúmenes muy grandes
  };

  // Calcular volumen total de medicamentos seleccionados
  const calcularVolumenTotal = () => {
    if (medicamentosSeleccionados.length === 0) return 0;

    let volumenTotal = 0;

    medicamentosSeleccionados.forEach(medId => {
      const dosis = dosisCalculadas[medId];

      if (dosis && dosis.volumenMl && dosis.volumenMl !== "Consultar") {
        // Si es ceftriaxona/Rocephin, el volumen es el del diluyente
        if ((medId === "ceftriaxona" || medicamentos.find(m => m.id === medId)?.nombre.toLowerCase().includes('rocephin')) && diluyentesSeleccionados[medId]) {
          volumenTotal += parseFloat(diluyentesSeleccionados[medId].proporcion.volumenMl);
        } else {
          volumenTotal += parseFloat(dosis.volumenMl);
        }
      }
    });

    // Sumar lidocaína una sola vez (nivel de jeringa)
    volumenTotal += lidocainaVolumenActual;

    return volumenTotal;
  };

  // Renderizar selector de presentaciones comerciales
  const renderSelectorPresentaciones = (medId) => {
    const medicamento = medicamentos.find(m => m.id === medId);
    if (!medicamento || !medicamento.presentacionesComerciales || medicamento.presentacionesComerciales.length <= 1) {
      return null;
    }
    
    return (
      <div className="mt-2">
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
          Presentación:
        </label>
        <select
          value={JSON.stringify(presentacionSeleccionada[medId] || {})}
          onChange={(e) => cambiarPresentacion(medId, JSON.parse(e.target.value))}
          className={`block w-full px-3 py-3 sm:py-1.5 text-base sm:text-sm rounded-md ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
        >
          {medicamento.presentacionesComerciales.map((presentacion, idx) => (
            <option key={idx} value={JSON.stringify(presentacion)}>
              {presentacion.nombre} ({presentacion.concentracion} {presentacion.unidad}/{presentacion.volumenMl} ml)
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Selector de vía de administración
  const renderSelectorVia = () => {
    const vias = ["IM", "IV", "SC"];
    
    return (
      <div className="mb-4">
        <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Vía de administración
        </label>
        <div className="flex space-x-2">
          {vias.map(via => (
            <button
              key={via}
              onClick={() => setViaAdministracion(via)}
              className={`px-6 py-3 sm:px-4 sm:py-2 rounded-md text-base sm:text-sm font-medium transition-colors ${
                viaAdministracion === via
                  ? darkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } active:scale-95`}
            >
              {via}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Renderizar técnica de administración para un medicamento y vía
  const renderTecnicaAdministracion = (medId) => {
    const medicamento = medicamentos.find(m => m.id === medId);
    if (!medicamento || !medicamento.tecnicaAdministracion || !medicamento.tecnicaAdministracion[viaAdministracion]) {
      return null;
    }
    
    return (
      <div className="mt-3 p-2 rounded-md bg-opacity-50 text-sm">
        <h4 className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
          Técnica de administración {viaAdministracion}:
        </h4>
        <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
          {medicamento.tecnicaAdministracion[viaAdministracion]}
        </p>
      </div>
    );
  };

  // Renderizado de la interfaz
  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      {/* Header con título y modo oscuro */}
      <header className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md px-4 py-3`}>
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
          <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-blue-800'} mb-2 sm:mb-0`}>
            Dosificador Seguro
          </h1>
          <div className="flex items-center space-x-3">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {darkMode ? 'Modo oscuro' : 'Modo claro'}
            </span>
            <Switch
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
              onColor="#3B82F6"
              offColor="#CBD5E1"
            />
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-2 sm:p-4">
        <div className="flex flex-col md:flex-row gap-2 sm:gap-4">
          {/* Panel izquierdo: datos del paciente */}
          <div className={`w-full md:w-1/3 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-3 sm:p-4 mb-4 md:mb-0`}>
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
              Datos del paciente
            </h2>
            
            <div className="mb-4">
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Peso (kg)
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={peso}
                onChange={(e) => setPeso(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-md ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            
            <div className="mb-4">
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Edad
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max={unidadEdad === "años" ? 100 : 120}
                  value={edad}
                  onChange={(e) => setEdad(Number(e.target.value))}
                  className={`w-2/3 px-3 py-2 rounded-md ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <select
                  value={unidadEdad}
                  onChange={(e) => setUnidadEdad(e.target.value)}
                  className={`w-1/3 px-3 py-2 rounded-md ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="años">Años</option>
                  <option value="meses">Meses</option>
                </select>
              </div>
            </div>
            
            {/* Selector de vía de administración */}
            {renderSelectorVia()}
            
            <div className="mt-8">
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Leyenda</h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center">
                  <div className={`w-4 h-4 ${darkMode ? 'bg-green-600' : 'bg-green-200'} rounded mr-2`}></div>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Disponible</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Seleccionado</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-400 rounded mr-2"></div>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Precaución: interacción moderada</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Bloqueado: interacción o condición</span>
                </div>
              </div>
            </div>

            {/* Fase 4: Condiciones del paciente */}
            <CondicionesPaciente
              darkMode={darkMode}
              condicionesActivas={condicionesPaciente}
              onChange={setCondicionesPaciente}
            />

            {/* Fase 3: Presets guardados */}
            <PresetPanel
              darkMode={darkMode}
              datosActuales={{
                peso,
                edad,
                unidadEdad,
                viaAdministracion,
                medicamentosSeleccionados,
                condicionesPaciente
              }}
              onCargarPreset={cargarPreset}
            />
          </div>
          
          {/* Panel central: selección de medicamentos */}
          <div className={`w-full md:w-1/3 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-3 sm:p-4 mb-4 md:mb-0`}>
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
              Seleccionar medicamentos
            </h2>
            
            <div className="grid grid-cols-1 gap-3">
              {medicamentos.map((med) => {
                const status = getMedicamentoStatus(med.id);
                let bgColor = darkMode ? "bg-green-700" : "bg-green-200";
                let textColor = darkMode ? "text-white" : "text-gray-800";
                
                if (status === "seleccionado") {
                  bgColor = "bg-blue-500";
                  textColor = "text-white";
                }
                else if (status === "precaucion") {
                  bgColor = darkMode ? "bg-yellow-600" : "bg-yellow-400";
                  textColor = darkMode ? "text-white" : "text-gray-800";
                }
                else if (status === "bloqueado" || status === "bloqueado_condicion") {
                  bgColor = "bg-red-500";
                  textColor = "text-white";
                  bgColor += " opacity-50";
                }
                
                return (
                  <div key={med.id} className="flex">
                    <button
                      onClick={() => status !== "bloqueado" && status !== "bloqueado_condicion" && toggleMedicamento(med.id)}
                      className={`flex-grow p-3 rounded-l-md ${bgColor} ${textColor} transition-all hover:shadow-md text-left`}
                      disabled={status === "bloqueado" || status === "bloqueado_condicion"}
                    >
                      <div className="font-medium">{med.nombre}</div>
                      <div className="text-sm opacity-80">{med.tipoMedicamento}</div>
                    </button>
                    <button 
                      onClick={() => abrirDetalles(med)}
                      className={`p-3 sm:p-2 rounded-r-md ${bgColor} ${textColor} transition-all hover:shadow-md flex items-center justify-center active:scale-95`}
                      disabled={status === "bloqueado" || status === "bloqueado_condicion"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Panel derecho: resultados */}
          <div className="w-full md:w-1/3">
            {/* Visualización de jeringa única con volumen total */}
            {medicamentosSeleccionados.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 mb-4`}>
                <h2 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                  Jeringa preparada
                </h2>
                <div className="flex justify-center mb-3">
                  <div className="text-center">
                    <JeringaMejorada
                      medicamentosInfo={medicamentosSeleccionados.map(medId => {
                        const med = medicamentos.find(m => m.id === medId);
                        const dosis = dosisCalculadas[medId] || {};

                        // Obtener color según medicamento
                        const getColorMedicamento = () => {
                          const colores = {
                            'metamizol': '#FF9500', // Naranja intenso
                            'metoclopramida': '#00CC66', // Verde medio
                            'dexametasona': '#FFFACD', // Amarillo claro-limón
                            'diazepam': '#4DA6FF', // Azul medio
                            'diclofenac': '#FF6B8A', // Rosa intenso
                            'penicilina': '#BA55D3', // Púrpura intenso
                            'lorazepam': '#5D8AA8', // Azul acero
                            'ketorolaco': '#FF496C', // Rosa más intenso que diclofenac
                            'ceftriaxona': '#9370DB', // Púrpura medio-claro
                            'lidocaina': '#AC92EC', // Púrpura claro
                            'adrenalina': '#FF0000', // Rojo - emergencia
                            'ondansetron': '#00CED1', // Turquesa oscuro
                            'hidrocortisona': '#FFD700', // Dorado
                            'tramadol': '#FF8C00', // Naranja oscuro
                            'difenhidramina': '#FF69B4', // Rosa fuerte
                            'atropina': '#32CD32' // Verde lima
                          };
                          return colores[medId] || '#70C1FF';
                        };

                        // Determinar volumen
                        let volumenMedicamento = 0;
                        if (dosis.volumenMl && dosis.volumenMl !== "Consultar") {
                          if ((medId === "ceftriaxona" || med?.nombre?.toLowerCase().includes('rocephin')) && diluyentesSeleccionados[medId]) {
                            volumenMedicamento = parseFloat(diluyentesSeleccionados[medId].proporcion.volumenMl);
                          } else {
                            volumenMedicamento = parseFloat(dosis.volumenMl);
                          }
                        }

                        return {
                          id: medId,
                          nombre: med?.nombre || 'Medicamento',
                          tipoMedicamento: med?.tipoMedicamento || 'Desconocido',
                          volumenMl: volumenMedicamento.toFixed(1),
                          color: getColorMedicamento()
                        };
                      }).filter(med => parseFloat(med.volumenMl) > 0).concat(
                        // Agregar lidocaína como capa única si está activa
                        lidocainaVolumenActual > 0 ? [{
                          id: 'lidocaina_syringe',
                          nombre: 'Lidocaína 1%',
                          tipoMedicamento: 'Anestésico local',
                          volumenMl: lidocainaVolumenActual.toFixed(1),
                          color: '#AC92EC'
                        }] : []
                      )}
                      capacidadMaxima={getCapacidadJeringaRecomendada(calcularVolumenTotal())}
                      darkMode={darkMode}
                    />
                    <div className="text-xs mt-2">
                      <span className={`px-2 py-1 rounded ${darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                        Volumen total: {calcularVolumenTotal().toFixed(1)} ml
                      </span>
                    </div>

                    {/* Frasco de lidocaína junto a la jeringa */}
                    {lidocainaVolumenActual > 0 && (
                      <div className="flex justify-center mt-2">
                        <FrascoMedicamento
                          volumenMl={lidocainaVolumenActual}
                          medicamento={{
                            nombre: "Lidocaína 1%",
                            tipoMedicamento: "Anestésico local"
                          }}
                          darkMode={darkMode}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel de lidocaína a nivel de jeringa */}
                {viaAdministracion === "IM" && (
                  <div className="mt-3">
                    <LidocainaSyringePanel
                      compatibilidad={lidocainaEvaluacion.compatibilidad}
                      calculo={lidocainaEvaluacion.calculo}
                      notasClinicas={lidocainaEvaluacion.notas}
                      lidocainaActiva={lidocainaActiva}
                      volumenSeleccionado={lidocainaVolumenActual}
                      onToggle={setLidocainaActiva}
                      onOpcionChange={setLidocainaOpcion}
                      opcionActual={lidocainaOpcion}
                      darkMode={darkMode}
                      pesoKg={peso}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Dosis calculadas */}
            {medicamentosSeleccionados.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 mb-4`}>
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                  Dosis calculadas
                </h2>
                
                <div className="space-y-4">
                  {medicamentosSeleccionados.map(medId => {
                    const med = medicamentos.find(m => m.id === medId);
                    const dosis = dosisCalculadas[medId] || {};

                    return (
                      <div
                        key={medId}
                        className={`p-4 rounded-md ${
                          dosis.contraindicado
                            ? darkMode ? 'bg-red-900 bg-opacity-40' : 'bg-red-50'
                            : dosis.precaucion
                              ? darkMode ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-50'
                              : darkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-grow pr-4">
                            <div className="flex flex-col">
                            <h3 className={`font-medium ${
                              dosis.contraindicado
                                ? darkMode ? 'text-red-300' : 'text-red-600'
                                : darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {med.nombre}
                            </h3>

                            {dosis.contraindicado ? (
                              <div className={`font-medium ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                                {dosis.mensaje}
                                {dosis.razon && <div className="text-sm mt-1">{dosis.razon}</div>}
                              </div>
                            ) : (
                              <div>
                                <div className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                                  {dosis.mensaje}
                                </div>
                                <div className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {dosis.explicacion}
                                </div>

                                {/* Mostrar información del diluyente para ceftriaxona */}
                                {(med.id === "ceftriaxona" || med.nombre.toLowerCase().includes('rocephin')) && diluyentesSeleccionados[med.id] && (
                                  <div className={`text-sm mt-2 p-2 rounded ${darkMode ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-50'}`}>
                                    <span className="font-medium">Diluyente: </span>
                                    {diluyentesSeleccionados[med.id].nombreCompleto} - {diluyentesSeleccionados[med.id].proporcion.volumenMl} ml
                                    <div className="mt-1">
                                      <span className="font-medium">Concentración resultante: </span>
                                      {diluyentesSeleccionados[med.id].concentracionResultante}
                                    </div>

                                    {/* Selector de volumen de diluyente */}
                                    <DiluyenteSelector
                                      diluyenteActual={diluyentesSeleccionados[med.id]}
                                      proporciones={diluyentesSeleccionados[med.id].proporciones}
                                      onChange={(proporcionPersonalizada) => {
                                        setDiluyentesSeleccionados(prev => ({
                                          ...prev,
                                          [med.id]: {
                                            ...prev[med.id],
                                            proporcion: proporcionPersonalizada
                                          }
                                        }));
                                      }}
                                      darkMode={darkMode}
                                    />
                                  </div>
                                )}

                                {/* Selector de presentaciones */}
                                {renderSelectorPresentaciones(medId)}

                                {/* Técnica de administración */}
                                {renderTecnicaAdministracion(medId)}

                                {/* Vías alternativas */}
                                {mostrarViasAlternativas(medId)}

                                {/* Fase 2: Indicador de redondeo snapGrid */}
                                {dosis.volumenMl && dosis.volumenMl !== "Consultar" && (() => {
                                  const snap = getSnapInfo(dosis.volumenMl);
                                  if (snap.wasRounded) {
                                    return (
                                      <div className={`text-xs mt-1 px-2 py-1 rounded ${
                                        snap.diffPercent > 5
                                          ? darkMode ? 'bg-yellow-900 bg-opacity-40 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                                          : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        Volumen ajustado: {snap.snapped} mL (jeringa {snap.syringe.label})
                                        {snap.diffPercent > 5 && ` — reducción ${snap.diffPercent}%`}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}

                                {/* Fase 5: Panel de información FDA */}
                                <FdaInfoPanel medicamentoId={medId} darkMode={darkMode} />
                              </div>
                            )}
                          </div>

                          {/* Visualización del frasco/vial */}
                          {!dosis.contraindicado && dosis.volumenMl && dosis.volumenMl !== "Consultar" && (
                            <div className="flex-shrink-0">
                              {(med.id === "ceftriaxona" || med.nombre.toLowerCase().includes('rocephin')) && diluyentesSeleccionados[med.id] ? (
                                <div className="flex gap-2">
                                  <FrascoMedicamento
                                    esPolvo={true}
                                    concentracion={dosis.dosisCalculada}
                                    unidadMedida={dosis.unidad}
                                    medicamento={med}
                                    darkMode={darkMode}
                                  />
                                  <FrascoMedicamento
                                    volumenMl={diluyentesSeleccionados[med.id].proporcion.volumenMl}
                                    medicamento={{
                                      nombre: "Diluyente",
                                      tipoMedicamento: "Diluyente"
                                    }}
                                    darkMode={darkMode}
                                  />
                                </div>
                              ) : (
                                <FrascoMedicamento
                                    volumenMl={dosis.volumenMl}
                                    concentracion={dosis.dosisCalculada}
                                    unidadMedida={dosis.unidad}
                                    medicamento={med}
                                    darkMode={darkMode}
                                  />
                              )}
                            </div>
                          )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Interacciones */}
            {interacciones.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 mb-4`}>
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                  Interacciones detectadas
                </h2>
                
                {interacciones.map((interaccion, index) => (
                  <div
                    key={index}
                    className={`mb-3 p-3 rounded-md ${
                      interaccion.nivel === "peligrosa" || interaccion.nivel === "contraindicado"
                        ? darkMode ? 'bg-red-900 bg-opacity-30' : 'bg-red-50'
                        : darkMode ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-50'
                    }`}
                  >
                    <h3 className={`font-medium flex flex-wrap items-center gap-2 ${
                      interaccion.nivel === "peligrosa" || interaccion.nivel === "contraindicado"
                        ? darkMode ? 'text-red-300' : 'text-red-600'
                        : darkMode ? 'text-yellow-300' : 'text-yellow-700'
                    }`}>
                      {interaccion.nombre}
                      {(interaccion.nivel === "precaucion") && (
                        <span className={`ml-2 ${
                          darkMode ? 'bg-yellow-600' : 'bg-yellow-500'
                        } ${darkMode ? 'text-gray-900' : 'text-white'} text-xs py-1 px-2 rounded`}>
                          PRECAUCIÓN
                        </span>
                      )}
                      {interaccion.pediatrica && (
                        <span className={`ml-2 ${
                          darkMode ? 'bg-blue-600' : 'bg-blue-500'
                        } text-white text-xs py-1 px-2 rounded`}>
                          PEDIÁTRICA
                        </span>
                      )}
                      {interaccion.mezcla && (
                        <span className={`ml-2 ${
                          darkMode ? 'bg-purple-600' : 'bg-purple-500'
                        } text-white text-xs py-1 px-2 rounded`}>
                          MEZCLA
                        </span>
                      )}
                    </h3>
                    <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {interaccion.descripcion}
                    </p>
                    <p className={`text-sm font-medium mt-2 ${
                      darkMode ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                      Recomendación: {interaccion.consejos}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Fase 4: Alertas droga-enfermedad */}
            {alertasDrogaEnfermedad.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 mb-4`}>
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>
                  Alertas droga-enfermedad
                </h2>

                {alertasDrogaEnfermedad.map((alerta, index) => {
                  const med = medicamentos.find(m => m.id === alerta.medicamentoId);
                  const bgSeveridad = alerta.severidad === 'alta'
                    ? darkMode ? 'bg-red-900 bg-opacity-30' : 'bg-red-50'
                    : alerta.severidad === 'media'
                      ? darkMode ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-50'
                      : darkMode ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-50';
                  const textSeveridad = alerta.severidad === 'alta'
                    ? darkMode ? 'text-red-300' : 'text-red-600'
                    : alerta.severidad === 'media'
                      ? darkMode ? 'text-yellow-300' : 'text-yellow-700'
                      : darkMode ? 'text-blue-300' : 'text-blue-600';

                  return (
                    <div key={index} className={`mb-3 p-3 rounded-md ${bgSeveridad}`}>
                      <h3 className={`font-medium flex flex-wrap items-center gap-2 ${textSeveridad}`}>
                        {med?.nombre || alerta.medicamentoId}
                        <span className={`text-xs py-0.5 px-2 rounded ${
                          alerta.severidad === 'alta' ? 'bg-red-500 text-white' :
                          alerta.severidad === 'media' ? 'bg-yellow-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          {alerta.severidad.toUpperCase()}
                        </span>
                        <span className={`text-xs py-0.5 px-2 rounded ${darkMode ? 'bg-orange-700 text-orange-200' : 'bg-orange-200 text-orange-800'}`}>
                          {alerta.condicion}
                        </span>
                      </h3>
                      <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {alerta.mensaje}
                      </p>
                      <p className={`text-sm font-medium mt-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        {alerta.recomendacion}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Condiciones identificadas */}
            {condicionesIdentificadas.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                  ¿Qué estás tratando?
                </h2>
                
                {condicionesIdentificadas.map((condicion, index) => (
                  <div 
                    key={index} 
                    className={`mb-3 p-3 rounded-md ${
                      darkMode ? 'bg-green-900 bg-opacity-30 border-green-800' : 'bg-green-50 border-green-200'
                    } border`}
                  >
                    <h3 className={`font-medium flex flex-wrap items-center gap-2 ${
                      darkMode ? 'text-green-300' : 'text-green-700'
                    }`}>
                      {condicion.condicion}
                      {condicion.coincidencia === "completa" ? (
                        <span className="ml-2 bg-green-500 text-white text-xs py-1 px-2 rounded">
                          COMBINACIÓN ESTÁNDAR
                        </span>
                      ) : (
                        <span className="ml-2 bg-blue-500 text-white text-xs py-1 px-2 rounded">
                          COMBINACIÓN PARCIAL
                        </span>
                      )}
                    </h3>
                    <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {condicion.descripcion}
                    </p>
                    <div className="flex flex-wrap mt-2 gap-2">
                      {condicion.medicamentosCoincidentes.map(medId => {
                        const med = medicamentos.find(m => m.id === medId);
                        return (
                          <span 
                            key={medId} 
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              darkMode 
                                ? 'bg-blue-900 text-blue-200'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {med.nombre}
                          </span>
                        );
                      })}
                    </div>
                    <p className={`text-sm font-medium mt-2 ${
                      darkMode ? 'text-yellow-300' : 'text-yellow-700'
                    }`}>
                      {condicion.advertencia}
                    </p>
                    <p className={`text-sm mt-1 ${
                      darkMode ? 'text-green-300' : 'text-green-700'
                    }`}>
                      Alternativa: {condicion.alternativa}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pautas pediátricas especiales */}
            {medicamentosSeleccionados.length > 0 &&
             (unidadEdad === "meses" || (unidadEdad === "años" && edad < 18)) && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 mb-4`}>
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                  Consideraciones Pediátricas
                </h2>

                {pautasPediatricasEspeciales
                  .filter(pauta => {
                    // Filtrar por grupo de edad relevante
                    if (pauta.titulo.includes("neonatos") && edadEnMeses <= 1) return true;
                    if (pauta.titulo.includes("lactantes") && edadEnMeses > 1 && edadEnMeses <= 12) return true;
                    if (pauta.titulo.includes("preescolares") && edadEnMeses > 12 && edadEnMeses <= 60) return true;
                    return false;
                  })
                  .map((pauta, index) => (
                    <div
                      key={index}
                      className={`mb-3 p-3 rounded-md ${
                        darkMode ? 'bg-blue-900 bg-opacity-30 border-blue-800' : 'bg-blue-50 border-blue-200'
                      } border`}
                    >
                      <h3 className={`font-medium mb-2 ${
                        darkMode ? 'text-blue-300' : 'text-blue-700'
                      }`}>
                        {pauta.titulo}
                      </h3>
                      <ul className={`list-disc list-inside space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {pauta.recomendaciones.map((recomendacion, i) => (
                          <li key={i}>{recomendacion}</li>
                        ))}
                      </ul>
                    </div>
                  ))
                }
              </div>
            )}

            {medicamentosSeleccionados.length === 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 flex items-center justify-center h-40`}>
                <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Selecciona medicamentos para ver dosis e interacciones
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Panel de detalle de medicamento */}
      {medicamentoDetalle && (
        <div className={`fixed inset-0 z-20 overflow-y-auto ${mostrarMaestroDetalle ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={cerrarDetalles}></div>
            
            <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 transform ${
              mostrarMaestroDetalle ? 'translate-y-0' : 'translate-y-4'
            } transition-transform duration-300`}>
              <button
                onClick={cerrarDetalles}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {medicamentoDetalle.nombre}
              </h2>
              
              <div className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <h3 className={`font-medium mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Descripción:</h3>
                <p className="text-sm">{medicamentoDetalle.descripcion}</p>
              </div>
              
              <div className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <h3 className={`font-medium mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Usos:</h3>
                <p className="text-sm">{medicamentoDetalle.usos}</p>
              </div>
              
              <div className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <h3 className={`font-medium mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Presentaciones comerciales:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {medicamentoDetalle.presentacionesComerciales?.map((p, idx) => (
                    <div key={idx} className={`p-2 rounded ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div className="font-medium">{p.nombre}</div>
                      <div>{p.concentracion} {p.unidad} en {p.volumenMl} ml</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <h3 className={`font-medium mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Dosis adultos:</h3>
                  <p className="text-sm">{medicamentoDetalle.dosisAdultos}</p>
                </div>
                
                <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <h3 className={`font-medium mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Dosis niños:</h3>
                  <p className="text-sm">
                    {medicamentoDetalle.dosisNinos.contraindicado && (
                      <span className="text-red-500 dark:text-red-400">
                        Contraindicado: {medicamentoDetalle.dosisNinos.contraindicado}
                      </span>
                    )}
                    {medicamentoDetalle.dosisNinos.dosis?.map((d, idx) => (
                      <div key={idx} className="mb-1">
                        {d.afeccion && <span className="font-medium">{d.afeccion}: </span>}
                        {`${d.edadMin}-${d.edadMax} ${d.unidad}: ${d.cantidad}`}
                      </div>
                    ))}
                  </p>
                </div>
              </div>
              
              <div className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <h3 className={`font-medium mb-1 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>Precauciones:</h3>
                <p className="text-sm">{medicamentoDetalle.precauciones}</p>
              </div>
              
              <div className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <h3 className={`font-medium mb-1 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>Contraindicaciones:</h3>
                <ul className="list-disc list-inside text-sm">
                  {medicamentoDetalle.contraindicaciones?.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    cerrarDetalles();
                    if (!medicamentosSeleccionados.includes(medicamentoDetalle.id) && 
                        getMedicamentoStatus(medicamentoDetalle.id) !== "bloqueado") {
                      toggleMedicamento(medicamentoDetalle.id);
                    }
                  }}
                  className={`px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm rounded ${
                    darkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } transition-colors`}
                >
                  {medicamentosSeleccionados.includes(medicamentoDetalle.id)
                    ? "Ya seleccionado"
                    : getMedicamentoStatus(medicamentoDetalle.id) === "bloqueado"
                      ? "Bloqueado por interacción"
                      : "Seleccionar medicamento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cuadros Clínicos Comunes */}
      <div className={`mt-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-6`}>
        <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Cuadros Clínicos Comunes
        </h2>
        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Seleccione un cuadro clínico para cargar automáticamente los medicamentos recomendados:
        </p>

        <div className="grid gap-4">
          {/* Gastroenteritis Aguda */}
          <div className={`border ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg p-4`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                1. Gastroenteritis Aguda con Dolor y Vómitos
              </h3>
              <button
                onClick={() => {
                  setMedicamentosSeleccionados([]);
                  setTimeout(() => {
                    setMedicamentosSeleccionados(['metamizol', 'metoclopramida']);
                  }, 100);
                }}
                className={`px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm rounded ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors`}
              >
                Cargar Combo
              </button>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Presentación: Dolor abdominal tipo cólico, vómitos, posible fiebre, deshidratación leve-moderada.
            </p>
            <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              Medicamentos: Dipirona (dolor/fiebre) + Metoclopramida (vómitos/náuseas)
            </p>
          </div>

          {/* Cuadro Respiratorio */}
          <div className={`border ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg p-4`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                2. Cuadro Respiratorio Inflamatorio/Infeccioso
              </h3>
              <button
                onClick={() => {
                  setMedicamentosSeleccionados([]);
                  setTimeout(() => {
                    setMedicamentosSeleccionados(['dexametasona', 'penicilina', 'metamizol']);
                  }, 100);
                }}
                className={`px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm rounded ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors`}
              >
                Cargar Combo
              </button>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Presentación: Fiebre, tos, dificultad respiratoria leve-moderada, posible componente obstructivo.
            </p>
            <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              Medicamentos: Dexametasona (inflamación) + Penicilina G (infección bacteriana) + Dipirona (fiebre)
            </p>
          </div>

          {/* Trauma Musculoesquelético */}
          <div className={`border ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg p-4`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                3. Trauma Musculoesquelético Agudo
              </h3>
              <button
                onClick={() => {
                  setMedicamentosSeleccionados([]);
                  setTimeout(() => {
                    setMedicamentosSeleccionados(['ketorolaco', 'diazepam', 'metamizol']);
                  }, 100);
                }}
                className={`px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm rounded ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors`}
              >
                Cargar Combo
              </button>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Presentación: Dolor intenso, inflamación, espasmo muscular tras lesión traumática.
            </p>
            <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              Medicamentos: Ketorolaco/Diclofenac (antiinflamatorio) + Diazepam (espasmo) + Dipirona (dolor)
            </p>
          </div>

          {/* Cuadro Migrañoso */}
          <div className={`border ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg p-4`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                4. Cuadro Migrañoso Severo
              </h3>
              <button
                onClick={() => {
                  setMedicamentosSeleccionados([]);
                  setTimeout(() => {
                    setMedicamentosSeleccionados(['metamizol', 'metoclopramida', 'diazepam']);
                  }, 100);
                }}
                className={`px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm rounded ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors`}
              >
                Cargar Combo
              </button>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Presentación: Cefalea intensa, fotofobia, náuseas, posible vómito, tensión cervical.
            </p>
            <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              Medicamentos: Dipirona (dolor) + Metoclopramida (náuseas/absorción) + Diazepam (tensión muscular)
            </p>
          </div>

          {/* Reacción Alérgica */}
          <div className={`border ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg p-4`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                5. Reacción Alérgica Moderada con Dolor
              </h3>
              <button
                onClick={() => {
                  setMedicamentosSeleccionados([]);
                  setTimeout(() => {
                    setMedicamentosSeleccionados(['dexametasona', 'metamizol', 'diazepam']);
                  }, 100);
                }}
                className={`px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm rounded ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors`}
              >
                Cargar Combo
              </button>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Presentación: Urticaria, prurito, angioedema leve, dolor asociado, ansiedad.
            </p>
            <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              Medicamentos: Dexametasona (reacción alérgica) + Dipirona (dolor/fiebre) + Diazepam (ansiedad)
            </p>
          </div>

          {/* Anafilaxia */}
          <div className={`border-2 ${darkMode ? 'border-red-700' : 'border-red-400'} rounded-lg p-4`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                6. ANAFILAXIA (EMERGENCIA)
              </h3>
              <button
                onClick={() => {
                  setMedicamentosSeleccionados([]);
                  setTimeout(() => {
                    setMedicamentosSeleccionados(['adrenalina', 'dexametasona', 'difenhidramina']);
                  }, 100);
                }}
                className={`px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm rounded ${
                  darkMode
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                } transition-colors`}
              >
                Cargar Combo
              </button>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Presentación: Urticaria generalizada, angioedema, broncoespasmo, hipotensión, taquicardia, disnea. Puede ser fatal.
            </p>
            <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'} font-medium mb-1`}>
              ADRENALINA IM es el PRIMER medicamento a administrar. NUNCA retrasarla.
            </p>
            <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              Medicamentos: Adrenalina IM 0.01mg/kg (PRIMERO) + Dexametasona (complemento) + Difenhidramina (complemento)
            </p>
          </div>

          {/* Convulsión Febril */}
          <div className={`border ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg p-4`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                7. Convulsión Febril Pediátrica
              </h3>
              <button
                onClick={() => {
                  setMedicamentosSeleccionados([]);
                  setTimeout(() => {
                    setMedicamentosSeleccionados(['diazepam', 'metamizol']);
                  }, 100);
                }}
                className={`px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm rounded ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors`}
              >
                Cargar Combo
              </button>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Presentación: Convulsión en niño febril (6 meses - 5 años). Generalizada, tónico-clónica, duración variable.
            </p>
            <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} mb-1`}>
              Diazepam rectal 0.5 mg/kg si no hay acceso IV. Convulsión febril simple tiene excelente pronóstico.
            </p>
            <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              Medicamentos: Diazepam (anticonvulsivante) + Dipirona (antipirético)
            </p>
          </div>

          {/* Cólico Renal */}
          <div className={`border ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg p-4`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                8. Cólico Renal Agudo
              </h3>
              <button
                onClick={() => {
                  setMedicamentosSeleccionados([]);
                  setTimeout(() => {
                    setMedicamentosSeleccionados(['ketorolaco', 'metamizol']);
                  }, 100);
                }}
                className={`px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm rounded ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors`}
              >
                Cargar Combo
              </button>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Presentación: Dolor súbito severo en flanco irradiado a ingle, náuseas/vómitos, hematuria, inquietud.
            </p>
            <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} mb-1`}>
              AINEs son PRIMERA LÍNEA (Cochrane). Si fiebre + dolor lumbar = litiasis infectada (EMERGENCIA).
            </p>
            <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              Medicamentos: Ketorolaco (analgésico) + Dipirona (espasmolítico). Tramadol si refractario.
            </p>
          </div>

          {/* Gastroenteritis Pediátrica */}
          <div className={`border ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg p-4`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                9. Gastroenteritis Pediátrica con Vómitos
              </h3>
              <button
                onClick={() => {
                  setMedicamentosSeleccionados([]);
                  setTimeout(() => {
                    setMedicamentosSeleccionados(['ondansetron', 'metamizol']);
                  }, 100);
                }}
                className={`px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm rounded ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors`}
              >
                Cargar Combo
              </button>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Presentación: Vómitos, diarrea, deshidratación en niños. Ondansetrón permite tolerar rehidratación oral.
            </p>
            <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} mb-1`}>
              Ondansetrón es MUY SUPERIOR a metoclopramida en niños (AAP). Sin efectos extrapiramidales.
            </p>
            <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              Medicamentos: Ondansetrón (antiemético seguro) + Dipirona (antipirético/analgésico)
            </p>
          </div>

          {/* Infección con ATB IM */}
          <div className={`border ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg p-4`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                10. Infección Bacteriana (ATB IM ambulatorio)
              </h3>
              <button
                onClick={() => {
                  setMedicamentosSeleccionados([]);
                  setTimeout(() => {
                    setMedicamentosSeleccionados(['ceftriaxona', 'metamizol']);
                  }, 100);
                }}
                className={`px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm rounded ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors`}
              >
                Cargar Combo
              </button>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Presentación: Infección bacteriana (celulitis, pielonefritis, neumonía, OMA complicada) para manejo IM ambulatorio rural.
            </p>
            <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} mb-1`}>
              Ceftriaxona IM 1x/día ideal para ámbito rural. Reevaluar a las 48-72h.
            </p>
            <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              Medicamentos: Ceftriaxona IM (antibiótico 1x/día) + Dipirona (dolor/fiebre)
            </p>
          </div>
        </div>

        <div className={`mt-6 p-4 ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'} rounded-lg`}>
          <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
            <strong>Importante:</strong> Estas combinaciones reflejan prácticas comunes pero deben ser prescritas y supervisadas por profesionales médicos.
            La administración parenteral requiere capacitación específica. Algunas combinaciones presentan interacciones que requieren precaución,
            especialmente en población pediátrica.
          </p>
        </div>
      </div>

      <footer className={`mt-8 py-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
        <p>ADVERTENCIA: Esta herramienta es solo educativa. Siempre busque atención médica profesional.</p>
        <p>No sustituye bajo ninguna circunstancia la supervisión de un profesional de la salud.</p>
      </footer>
    </div>
  );
};

export default App;