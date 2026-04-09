import React, { useState, useEffect } from 'react';

const JsonFormatter = () => {
  // 1. Intentar cargar datos previos de localStorage al iniciar
  const [tabs, setTabs] = useState(() => {
    const savedTabs = localStorage.getItem('json-formatter-tabs');
    return savedTabs ? JSON.parse(savedTabs) : [
      { id: 1, name: 'Tab 1', input: '', output: '', error: null }
    ];
  });

  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [copied, setCopied] = useState(false);

  // 2. Guardar automáticamente en localStorage cuando 'tabs' cambie
  useEffect(() => {
    localStorage.setItem('json-formatter-tabs', JSON.stringify(tabs));
  }, [tabs]);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const updateActiveTab = (newData) => {
    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, ...newData } : t));
  };

  const addTab = () => {
    const newId = Date.now(); // ID único basado en tiempo
    setTabs([...tabs, { id: newId, name: `Tab ${tabs.length + 1}`, input: '', output: '', error: null }]);
    setActiveTabId(newId);
  };

  const removeTab = (e, id) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) setActiveTabId(newTabs[0].id);
  };

  const handleFormat = () => {
    try {
      if (!activeTab.input.trim()) return;
      const parsed = JSON.parse(activeTab.input);
      const formatted = JSON.stringify(parsed, null, 2);
      updateActiveTab({ output: formatted, error: null });
    } catch (err) {
      updateActiveTab({ output: '', error: "❌ JSON no válido" });
    }
  };

  const handleCopy = async () => {
    if (!activeTab.output) return;
    await navigator.clipboard.writeText(activeTab.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-140px)] gap-2">
      
      {/* Barra de Pestañas con estilo mejorado */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-all border-b-2 text-sm whitespace-nowrap ${
              activeTabId === tab.id 
              ? 'bg-white border-indigo-600 text-indigo-600 font-bold shadow-sm' 
              : 'bg-gray-200 border-transparent text-gray-500 hover:bg-gray-300'
            }`}
          >
            <span>{tab.name}</span>
            {tabs.length > 1 && (
              <button 
                onClick={(e) => removeTab(e, tab.id)}
                className="hover:bg-gray-400/50 rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button 
          onClick={addTab}
          className="ml-2 w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer text-xl"
        >
          +
        </button>
      </div>

      {/* Área de Trabajo */}
      <div className="flex flex-1 gap-4 min-h-0 bg-white p-4 rounded-b-lg shadow-md border border-gray-200">
        <div className="flex flex-col flex-1 min-w-0">
          <textarea
            className="flex-1 w-full p-4 font-mono text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-gray-50 shadow-inner"
            value={activeTab.input}
            onChange={(e) => updateActiveTab({ input: e.target.value })}
            placeholder="Pega tu JSON aquí..."
          />
        </div>

        <div className="flex flex-col flex-1 min-w-0 relative">
          <div className="relative flex-1 w-full bg-[#0d1117] rounded-lg overflow-hidden border border-gray-800 shadow-2xl">
            {activeTab.output && !activeTab.error && (
              <button
                onClick={handleCopy}
                className={`absolute top-3 right-3 px-4 py-1.5 rounded-md text-xs font-bold z-10 transition-all cursor-pointer ${
                  copied ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {copied ? '✓ COPIADO' : 'COPIAR'}
              </button>
            )}
            <div className="h-full p-4 overflow-auto scrollbar-thin scrollbar-thumb-gray-700">
              {activeTab.error ? (
                <p className="text-red-400 font-mono text-sm">{activeTab.error}</p>
              ) : (
                <pre className="text-blue-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                  {activeTab.output || <span className="text-gray-600 italic">// El resultado aparecerá aquí...</span>}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Botón de Acción Principal */}
      <div className="flex justify-center py-2">
        <button
          onClick={handleFormat}
          className="px-20 py-3.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-xl cursor-pointer tracking-wider"
        >
          FORMAT {activeTab.name.toUpperCase()}
        </button>
      </div>
    </div>
  );
};

export default JsonFormatter;