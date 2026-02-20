import React, { useState, useEffect } from 'react';
import { fetchFdaInfo } from './services/openFdaService';

const FdaInfoPanel = ({ medicamentoId, darkMode }) => {
  const [expanded, setExpanded] = useState(false);
  const [fdaData, setFdaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (expanded && !fdaData && !loading) {
      setLoading(true);
      setError(null);
      fetchFdaInfo(medicamentoId)
        .then(result => {
          setFdaData(result.data);
          if (result.error) setError(result.error);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [expanded, medicamentoId, fdaData, loading]);

  const truncate = (text, maxLen = 300) => {
    if (!text || text.length <= maxLen) return text;
    return text.substring(0, maxLen) + '...';
  };

  const sectionClass = `text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`;
  const labelClass = `font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`mt-2 rounded ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'} border`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium ${
          darkMode ? 'text-blue-300 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-100'
        } rounded transition-colors`}
      >
        <span>Info FDA (OpenFDA)</span>
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-3">
          {loading && (
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Consultando OpenFDA...
            </div>
          )}

          {error && !fdaData && (
            <div className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
              {error}
            </div>
          )}

          {fdaData && fdaData.noDisponible && (
            <div className={`text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
              {fdaData.nota}
            </div>
          )}

          {fdaData && !fdaData.noDisponible && (
            <div className="space-y-2">
              {error && (
                <div className={`text-xs italic ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  {error}
                </div>
              )}

              {fdaData.advertenciaRecuadro && (
                <div className={`p-2 rounded text-xs ${darkMode ? 'bg-red-900 bg-opacity-30 text-red-300' : 'bg-red-50 text-red-700'}`}>
                  <span className={labelClass}>Advertencia FDA: </span>
                  {truncate(fdaData.advertenciaRecuadro)}
                </div>
              )}

              {fdaData.embarazo && (
                <div className={sectionClass}>
                  <span className={labelClass}>Embarazo: </span>
                  {truncate(fdaData.embarazo)}
                </div>
              )}

              {fdaData.lactancia && (
                <div className={sectionClass}>
                  <span className={labelClass}>Lactancia: </span>
                  {truncate(fdaData.lactancia)}
                </div>
              )}

              {fdaData.usoPediatrico && (
                <div className={sectionClass}>
                  <span className={labelClass}>Uso pediátrico: </span>
                  {truncate(fdaData.usoPediatrico)}
                </div>
              )}

              {fdaData.usoGeriatrico && (
                <div className={sectionClass}>
                  <span className={labelClass}>Uso geriátrico: </span>
                  {truncate(fdaData.usoGeriatrico)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FdaInfoPanel;
