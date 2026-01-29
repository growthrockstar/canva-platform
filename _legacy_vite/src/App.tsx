import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Canvas } from './components/Canvas';

function App() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] selection:bg-[var(--color-primary)] selection:text-white flex flex-col">
      <Header />
      <Dashboard />
      <main className="flex-1">
        <Canvas />
      </main>
    </div>
  )
}

export default App
