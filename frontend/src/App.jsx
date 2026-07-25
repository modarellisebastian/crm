import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/leads'
import Clientes from './pages/clientes'
import Finanzas from './pages/Finanzas'
import Scraper from './pages/Scraper'
import Reportes from './pages/Reportes'
import Cola from './pages/Cola'
// Casa (finanzas personales) — dominio separado del negocio, bajo /casa/*
import FinanzasCasa from './pages/casa'

function App() {
  return (
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
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/finanzas" element={<Finanzas />} />
        <Route path="/scraper"  element={<Scraper />} />
        <Route path="/reportes" element={<Reportes />} />

        {/* Casa */}
        <Route path="/casa/*" element={<FinanzasCasa />} />
      </Route>
    </Routes>
  )
}

export default App
