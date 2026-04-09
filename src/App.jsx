import JsonFormatter from './JsonFormatter';

function App() {
  return (
    /* h-screen para que el fondo ocupe toda la pantalla y no haya scroll innecesario */
    <div className="h-screen bg-gray-50 flex flex-col p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-black text-gray-800">
          JSON <span className="text-indigo-600">Prettier</span>
        </h1>
      </header>
      
      <main className="flex-1">
        <JsonFormatter />
      </main>
    </div>
  );
}

export default App;