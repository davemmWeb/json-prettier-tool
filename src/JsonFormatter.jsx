import React, { useState, useEffect } from 'react';

const JsonFormatter = () => {
  const [tabs, setTabs] = useState(() => {
    const savedTabs = localStorage.getItem('dev-tools-tabs');
    return savedTabs ? JSON.parse(savedTabs) : [
      { 
        id: 1, 
        name: 'Tool 1', 
        type: 'formatter', 
        input: '', 
        input2: '', 
        output: '', 
        method: 'GET', 
        url: '', 
        error: null 
      }
    ];
  });

  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || 1);
  const [loading, setLoading] = useState(false);
  const [compared, setCompared] = useState(false);

  useEffect(() => {
    localStorage.setItem('dev-tools-tabs', JSON.stringify(tabs));
  }, [tabs]);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const updateActiveTab = (newData) => {
    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, ...newData } : t));
  };

  // --- Lógica de Formateo ---
  const handleFormat = () => {
    try {
      if (!activeTab.input.trim()) return;
      const parsed = JSON.parse(activeTab.input);
      updateActiveTab({ output: JSON.stringify(parsed, null, 2), error: null });
    } catch (err) {
      updateActiveTab({ output: '', error: "❌ JSON Inválido en el Input 1" });
    }
  };

  // --- Lógica de Petición REST ---
  const handleRequest = async () => {
    if (!activeTab.url) return;
    setLoading(true);
    try {
      const options = {
        method: activeTab.method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (['POST', 'PUT', 'PATCH'].includes(activeTab.method) && activeTab.input) {
        options.body = activeTab.input;
      }

      const response = await fetch(activeTab.url, options);
      const data = await response.json();
      updateActiveTab({ output: JSON.stringify(data, null, 2), error: null });
    } catch (err) {
      updateActiveTab({ output: '', error: `❌ Error en la petición: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  // --- Algoritmo de Diff por Mapa de Rutas Exacto ---
  const buildDiffMap = (obj1, obj2) => {
    const diffMap = {};

    const isObject = (val) => val !== null && typeof val === 'object';

    const traverse = (o1, o2, path = '') => {
      const keys1 = isObject(o1) ? Object.keys(o1) : [];
      const keys2 = isObject(o2) ? Object.keys(o2) : [];
      const allKeys = Array.from(new Set([...keys1, ...keys2]));

      allKeys.forEach((key) => {
        const currentPath = path ? `${path}.${key}` : key;
        const exists1 = isObject(o1) && key in o1;
        const exists2 = isObject(o2) && key in o2;

        if (exists1 && !exists2) {
          diffMap[currentPath] = 'removed';
        } else if (!exists1 && exists2) {
          diffMap[currentPath] = 'added';
        } else if (isObject(o1[key]) && isObject(o2[key])) {
          traverse(o1[key], o2[key], currentPath);
        } else if (o1[key] !== o2[key]) {
          diffMap[currentPath] = 'modified';
        } else {
          diffMap[currentPath] = 'unchanged';
        }
      });
    };

    traverse(obj1, obj2);
    return diffMap;
  };

  const handleCompare = () => {
    try {
      if (!activeTab.input.trim() || !activeTab.input2.trim()) {
        updateActiveTab({ error: "❌ Por favor ingresa ambos JSON para comparar" });
        return;
      }

      const obj1 = JSON.parse(activeTab.input);
      const obj2 = JSON.parse(activeTab.input2);

      updateActiveTab({
        input: JSON.stringify(obj1, null, 2),
        input2: JSON.stringify(obj2, null, 2),
        error: null
      });

      setCompared(true);
    } catch (err) {
      updateActiveTab({ error: `❌ Error al parsear JSONs: ${err.message}` });
      setCompared(false);
    }
  };

  // Renderizador de líneas basado en la pila estructural de la sintaxis
  const renderHighlightedJson = (jsonString, otherJsonString, side) => {
    if (!compared || !jsonString.trim()) {
      return <pre className="text-blue-300 font-mono text-xs whitespace-pre-wrap">{jsonString}</pre>;
    }

    try {
      const objCurrent = JSON.parse(jsonString);
      const objOther = JSON.parse(otherJsonString || '{}');

      const diffMap = side === 'left' 
        ? buildDiffMap(objCurrent, objOther) 
        : buildDiffMap(objOther, objCurrent);

      const lines = jsonString.split('\n');
      const stack = [];

      return (
        <div className="font-mono text-xs leading-relaxed">
          {lines.map((line, idx) => {
            const indentMatch = line.match(/^(\s*)/);
            const indentSpaces = indentMatch ? indentMatch[1].length : 0;
            const level = Math.floor(indentSpaces / 2);

            stack.length = level;

            const keyMatch = line.match(/"([^"]+)":/);
            if (keyMatch) {
              stack[level] = keyMatch[1];
            }

            const currentPath = stack.filter(Boolean).join('.');
            const status = diffMap[currentPath];

            let bgColor = '';
            let textColor = 'text-gray-300';
            let prefix = ' ';

            if (keyMatch && status) {
              if (side === 'left') {
                if (status === 'removed') {
                  bgColor = 'bg-red-950/70 border-l-4 border-red-500';
                  textColor = 'text-red-300';
                  prefix = '-';
                } else if (status === 'modified') {
                  bgColor = 'bg-yellow-950/70 border-l-4 border-yellow-500';
                  textColor = 'text-yellow-300';
                  prefix = '≠';
                }
              } else {
                if (status === 'added') {
                  bgColor = 'bg-green-950/70 border-l-4 border-green-500';
                  textColor = 'text-green-300';
                  prefix = '+';
                } else if (status === 'modified') {
                  bgColor = 'bg-yellow-950/70 border-l-4 border-yellow-500';
                  textColor = 'text-yellow-300';
                  prefix = '≠';
                }
              }
            }

            return (
              <div key={idx} className={`px-2 py-0.5 whitespace-pre-wrap ${bgColor} ${textColor}`}>
                <span className="select-none opacity-40 mr-2 inline-block w-3 text-center">{prefix}</span>
                {line}
              </div>
            );
          })}
        </div>
      );
    } catch {
      return <pre className="text-blue-300 font-mono text-xs">{jsonString}</pre>;
    }
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-140px)] gap-2">
      {/* Barra de Pestañas */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTabId(tab.id); setCompared(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all border-b-2 text-sm whitespace-nowrap cursor-pointer ${
              activeTabId === tab.id ? 'bg-white border-indigo-600 text-indigo-600 font-bold shadow-sm' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {tab.name}
            {tabs.length > 1 && (
              <span 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const filtered = tabs.filter(t => t.id !== tab.id);
                  setTabs(filtered);
                  if (activeTabId === tab.id) setActiveTabId(filtered[0].id);
                }} 
                className="ml-1 hover:text-red-500 cursor-pointer"
              >
                ✕
              </span>
            )}
          </button>
        ))}
        <button 
          onClick={() => setTabs([...tabs, { id: Date.now(), name: `Tool ${tabs.length + 1}`, type: 'formatter', input: '', input2: '', output: '', method: 'GET', url: '', error: null }])} 
          className="ml-2 w-8 h-8 bg-indigo-600 text-white rounded-full font-bold cursor-pointer"
        >
          +
        </button>
      </div>

      {/* Selector de Herramienta */}
      <div className="flex gap-4 mb-2">
        <select 
          value={activeTab.type} 
          onChange={(e) => {
            updateActiveTab({ type: e.target.value, output: '', error: null });
            setCompared(false);
          }}
          className="bg-white border border-gray-300 rounded px-3 py-1 text-sm font-medium outline-none cursor-pointer"
        >
          <option value="formatter">JSON Formatter</option>
          <option value="compare">JSON Diff / Compare</option>
          <option value="rest">REST Client (Fetch)</option>
        </select>
      </div>

      {/* Área de Trabajo */}
      <div className="flex flex-1 gap-4 min-h-0 bg-white p-4 rounded-b-lg shadow-md border border-gray-200">
        {activeTab.type === 'compare' ? (
          <div className="flex flex-1 gap-4 min-h-0 w-full">
            {/* Panel Izquierdo (JSON 1) */}
            <div className="flex flex-col flex-1 min-w-0 bg-[#0d1117] rounded-lg border border-gray-800 overflow-hidden shadow-inner">
              <div className="bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-400 border-b border-gray-800 flex justify-between">
                <span>JSON 1 (Original)</span>
                {compared && <span className="text-red-400">- Eliminados / ≠ Modificados</span>}
              </div>
              <div className="flex-1 overflow-auto p-2">
                {!compared ? (
                  <textarea
                    className="w-full h-full font-mono text-xs bg-transparent text-blue-300 outline-none resize-none"
                    value={activeTab.input}
                    onChange={(e) => updateActiveTab({ input: e.target.value })}
                    placeholder="Pega el primer JSON aquí..."
                  />
                ) : (
                  renderHighlightedJson(activeTab.input, activeTab.input2, 'left')
                )}
              </div>
            </div>

            {/* Panel Derecho (JSON 2) */}
            <div className="flex flex-col flex-1 min-w-0 bg-[#0d1117] rounded-lg border border-gray-800 overflow-hidden shadow-inner">
              <div className="bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-400 border-b border-gray-800 flex justify-between">
                <span>JSON 2 (A comparar)</span>
                {compared && <span className="text-green-400">+ Nuevos / ≠ Modificados</span>}
              </div>
              <div className="flex-1 overflow-auto p-2">
                {!compared ? (
                  <textarea
                    className="w-full h-full font-mono text-xs bg-transparent text-blue-300 outline-none resize-none"
                    value={activeTab.input2 || ''}
                    onChange={(e) => updateActiveTab({ input2: e.target.value })}
                    placeholder="Pega el segundo JSON aquí..."
                  />
                ) : (
                  renderHighlightedJson(activeTab.input2 || '', activeTab.input, 'right')
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col flex-1 min-w-0 gap-3">
              {activeTab.type === 'rest' && (
                <div className="flex gap-2">
                  <select 
                    value={activeTab.method} 
                    onChange={(e) => updateActiveTab({ method: e.target.value })}
                    className="bg-gray-100 border border-gray-300 rounded px-2 py-2 font-bold text-xs cursor-pointer"
                  >
                    <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="https://api.example.com/data"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    value={activeTab.url}
                    onChange={(e) => updateActiveTab({ url: e.target.value })}
                  />
                </div>
              )}

              <textarea
                className="flex-1 w-full p-4 font-mono text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-gray-50"
                value={activeTab.input}
                onChange={(e) => updateActiveTab({ input: e.target.value })}
                placeholder={activeTab.type === 'rest' ? 'Body (JSON) para POST/PUT...' : 'Pega tu JSON aquí...'}
              />
            </div>

            <div className="flex flex-col flex-1 min-w-0 relative">
              <div className="relative flex-1 w-full bg-[#0d1117] rounded-lg overflow-hidden border border-gray-800 shadow-2xl">
                <div className="h-full p-4 overflow-auto">
                  {activeTab.error ? (
                    <p className="text-red-400 font-mono text-sm">{activeTab.error}</p>
                  ) : (
                    <pre className="text-blue-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                      {loading ? "Cargando petición..." : activeTab.output || "// Resultado..."}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          onClick={
            activeTab.type === 'rest' 
              ? handleRequest 
              : activeTab.type === 'compare' 
              ? handleCompare 
              : handleFormat
          }
          disabled={loading}
          className="px-20 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-xl cursor-pointer disabled:bg-gray-400 transition-all"
        >
          {loading 
            ? 'PROCESANDO...' 
            : activeTab.type === 'rest' 
            ? 'ENVIAR PETICIÓN' 
            : activeTab.type === 'compare' 
            ? 'COMPARE (DIFF)' 
            : 'FORMATEAR'}
        </button>

        {activeTab.type === 'compare' && compared && (
          <button
            onClick={() => setCompared(false)}
            className="px-4 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 cursor-pointer"
          >
            ✏️ Editar JSONs
          </button>
        )}
      </div>
    </div>
  );
};

export default JsonFormatter;