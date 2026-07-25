import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/leads'
import Pipeline from './pages/Pipeline'
import Clientes from './pages/clientes'
import Finanzas from './pages/Finanzas'
import FinanzasCasa from './pages/FinanzasCasa'
import Scraper from './pages/Scraper'
import Reportes from './pages/Reportes'
import Cola from './pages/Cola'

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
        <Route index element={<Dashboard />} />
        <Route path="/leads"    element={<Leads />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/cola"     element={<Cola />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/finanzas" element={<Finanzas />} />
        <Route path="/casa"     element={<FinanzasCasa />} />
        <Route path="/scraper"   element={<Scraper />} />
        <Route path="/reportes"  element={<Reportes />} />
      </Route>
    </Routes>
  )
}

export default App
