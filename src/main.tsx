import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Route pages are code-split so each tab's deps (e.g. the shopping list's
// drag-and-drop engine) load only when that tab is opened, keeping the initial
// bundle small.
const ChoresPage = lazy(() => import('./components/ChoresPage.tsx'))
const ShoppingPage = lazy(() => import('./components/ShoppingPage.tsx'))

const pageFallback = <p className="text-muted">Cargando...</p>

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Navigate to="/tareas" replace />} />
          <Route path="tareas" element={<Suspense fallback={pageFallback}><ChoresPage /></Suspense>} />
          <Route path="compras" element={<Suspense fallback={pageFallback}><ShoppingPage /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
