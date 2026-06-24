import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ChoresPage from './components/ChoresPage.tsx'
import ShoppingPage from './components/ShoppingPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Navigate to="/tareas" replace />} />
          <Route path="tareas" element={<ChoresPage />} />
          <Route path="compras" element={<ShoppingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
