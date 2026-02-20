/**
 * Cliente para la API gratuita de OpenFDA.
 * Cache de 24h en localStorage, throttling, manejo de errores.
 * Funciona offline con datos cacheados.
 */

import fdaNameMap from '../data/fdaNameMap.json';

const BASE_URL = 'https://api.fda.gov/drug/label.json';
const CACHE_PREFIX = 'fda_cache_';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

// Throttle: máximo 1 request cada 500ms
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 500;

function getCacheKey(medicamentoId) {
  return CACHE_PREFIX + medicamentoId;
}

function getFromCache(medicamentoId) {
  try {
    const raw = localStorage.getItem(getCacheKey(medicamentoId));
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_DURATION_MS) {
      localStorage.removeItem(getCacheKey(medicamentoId));
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

function saveToCache(medicamentoId, data) {
  try {
    localStorage.setItem(getCacheKey(medicamentoId), JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {
    // localStorage lleno - no es crítico
  }
}

async function throttledFetch(url) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();
  return fetch(url);
}

/**
 * Extrae campos relevantes de un resultado de OpenFDA label.
 */
function extractRelevantInfo(result) {
  const info = {};

  if (result.pregnancy) {
    info.embarazo = Array.isArray(result.pregnancy) ? result.pregnancy[0] : result.pregnancy;
  }
  if (result.pregnancy_or_breast_feeding) {
    info.embarazo = info.embarazo || (Array.isArray(result.pregnancy_or_breast_feeding) ? result.pregnancy_or_breast_feeding[0] : result.pregnancy_or_breast_feeding);
  }
  if (result.nursing_mothers) {
    info.lactancia = Array.isArray(result.nursing_mothers) ? result.nursing_mothers[0] : result.nursing_mothers;
  }
  if (result.pediatric_use) {
    info.usoPediatrico = Array.isArray(result.pediatric_use) ? result.pediatric_use[0] : result.pediatric_use;
  }
  if (result.geriatric_use) {
    info.usoGeriatrico = Array.isArray(result.geriatric_use) ? result.geriatric_use[0] : result.geriatric_use;
  }
  if (result.warnings) {
    info.advertencias = Array.isArray(result.warnings) ? result.warnings[0] : result.warnings;
  }
  if (result.boxed_warning) {
    info.advertenciaRecuadro = Array.isArray(result.boxed_warning) ? result.boxed_warning[0] : result.boxed_warning;
  }
  if (result.contraindications) {
    info.contraindicaciones = Array.isArray(result.contraindications) ? result.contraindications[0] : result.contraindications;
  }

  return info;
}

/**
 * Consulta OpenFDA para un medicamento.
 * @param {string} medicamentoId - ID del medicamento en español
 * @returns {Promise<{data: object|null, error: string|null, fromCache: boolean}>}
 */
export async function fetchFdaInfo(medicamentoId) {
  // Verificar cache primero
  const cached = getFromCache(medicamentoId);
  if (cached) {
    return { data: cached, error: null, fromCache: true };
  }

  // Obtener nombre en inglés
  const mapping = fdaNameMap[medicamentoId];
  if (!mapping) {
    return { data: null, error: 'Medicamento no mapeado para FDA', fromCache: false };
  }

  // Metamizol no está aprobado en EEUU
  if (mapping.nota && mapping.nota.includes('No aprobado')) {
    const noAprobadoData = {
      nota: mapping.nota,
      noDisponible: true
    };
    saveToCache(medicamentoId, noAprobadoData);
    return { data: noAprobadoData, error: null, fromCache: false };
  }

  const searchTerm = encodeURIComponent(`"${mapping.en}"`);
  const url = `${BASE_URL}?search=openfda.generic_name:${searchTerm}&limit=1`;

  try {
    const response = await throttledFetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        const noData = { noDisponible: true, nota: 'No se encontraron datos en OpenFDA.' };
        saveToCache(medicamentoId, noData);
        return { data: noData, error: null, fromCache: false };
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();

    if (!json.results || json.results.length === 0) {
      const noData = { noDisponible: true, nota: 'No se encontraron datos en OpenFDA.' };
      saveToCache(medicamentoId, noData);
      return { data: noData, error: null, fromCache: false };
    }

    const info = extractRelevantInfo(json.results[0]);
    info.brandName = mapping.brandNames?.[0] || mapping.en;
    info.genericName = mapping.en;

    saveToCache(medicamentoId, info);
    return { data: info, error: null, fromCache: false };
  } catch (err) {
    // Intentar cache expirado como fallback offline
    try {
      const raw = localStorage.getItem(getCacheKey(medicamentoId));
      if (raw) {
        const cached = JSON.parse(raw);
        return { data: cached.data, error: 'Datos del cache (sin conexión)', fromCache: true };
      }
    } catch {}

    return { data: null, error: `Error de conexión: ${err.message}`, fromCache: false };
  }
}
