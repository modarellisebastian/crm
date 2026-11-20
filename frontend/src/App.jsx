import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './context/ToastProvider'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/leads'
import Clientes from './pages/clientes'
import DetalleCliente from './pages/clientes/DetalleCliente'
import Reportes from './pages/Reportes'
import Cola from './pages/Cola'
import Propuestas from './pages/propuestas'
// Casa (finanzas personales) — dominio separado del negocio, bajo /casa/*
import FinanzasCasa from './pages/casa'

function App() {
  return (
    <ToastProvider>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        {/* Negocio */}
        <Route index element={<Dashboard />} />
        <Route path="/leads"    element={<Leads />} />
        <Route path="/cola"     element={<Cola />} />
        <Route path="/clientes"     element={<Clientes />} />
        <Route path="/clientes/:id" element={<DetalleCliente />} />
        <Route path="/reportes"   element={<Reportes />} />
        <Route path="/propuestas" element={<Propuestas />} />

        {/* Casa */}
        <Route path="/casa/*" element={<FinanzasCasa />} />
      </Route>
    </Routes>
    </ToastProvider>
  )
}

export default App
