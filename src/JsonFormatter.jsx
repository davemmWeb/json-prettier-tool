import React, { useState, useEffect } from 'react';

const JsonFormatter = () => {
  const [tabs, setTabs] = useState(() => {
    const savedTabs = localStorage.getItem('dev-tools-tabs');
    return savedTabs ? JSON.parse(savedTabs) : [
      { id: 1, name: 'Tool 1', type: 'formatter', input: '', output: '', method: 'GET', url: '', error: null }
    ];
  });

  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
      updateActiveTab({ output: '', error: "❌ JSON Inválido" });
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

  return (
    <div className="flex flex-col w-full h-[calc(100vh-140px)] gap-2">
      {/* Barra de Pestañas */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all border-b-2 text-sm whitespace-nowrap cursor-pointer ${
              activeTabId === tab.id ? 'bg-white border-indigo-600 text-indigo-600 font-bold shadow-sm' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {tab.name}
            {tabs.length > 1 && <span onClick={(e) => { e.stopPropagation(); setTabs(tabs.filter(t => t.id !== tab.id)); }} className="ml-1 hover:text-red-500">✕</span>}
          </button>
        ))}
        <button onClick={() => setTabs([...tabs, { id: Date.now(), name: `Tool ${tabs.length + 1}`, type: 'formatter', input: '', output: '', method: 'GET', url: '', error: null }])} className="ml-2 w-8 h-8 bg-indigo-600 text-white rounded-full font-bold">+</button>
      </div>

      {/* Selector de Herramienta */}
      <div className="flex gap-4 mb-2">
        <select 
          value={activeTab.type} 
          onChange={(e) => updateActiveTab({ type: e.target.value, output: '', error: null })}
          className="bg-white border border-gray-300 rounded px-3 py-1 text-sm font-medium outline-none"
        >
          <option value="formatter">JSON Formatter</option>
          <option value="rest">REST Client (Fetch)</option>
        </select>
      </div>

      {/* Área de Trabajo Mixta */}
      <div className="flex flex-1 gap-4 min-h-0 bg-white p-4 rounded-b-lg shadow-md border border-gray-200">
        <div className="flex flex-col flex-1 min-w-0 gap-3">
          {activeTab.type === 'rest' && (
            <div className="flex gap-2">
              <select 
                value={activeTab.method} 
                onChange={(e) => updateActiveTab({ method: e.target.value })}
                className="bg-gray-100 border border-gray-300 rounded px-2 py-2 font-bold text-xs"
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

        {/* Visor de Resultados (Igual que antes) */}
        <div className="flex flex-col flex-1 min-w-0 relative">
          <div className="relative flex-1 w-full bg-[#0d1117] rounded-lg overflow-hidden border border-gray-800 shadow-2xl">
            <div className="h-full p-4 overflow-auto">
              {activeTab.error ? <p className="text-red-400 font-mono text-sm">{activeTab.error}</p> : (
                <pre className="text-blue-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                  {loading ? "Cargando petición..." : activeTab.output || "// Resultado..."}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center py-2">
        <button
          onClick={activeTab.type === 'rest' ? handleRequest : handleFormat}
          disabled={loading}
          className="px-20 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-xl cursor-pointer disabled:bg-gray-400"
        >
          {loading ? 'PROCESANDO...' : (activeTab.type === 'rest' ? 'ENVIAR PETICIÓN' : 'FORMATEAR')}
        </button>
      </div>
    </div>
  );
};

export default JsonFormatter;