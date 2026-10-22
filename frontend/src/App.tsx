import { Navigate, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { RutaProtegida, SoloSinSesion } from './components/RutaProtegida'
import Agenda from './pages/Agenda'
import CitaForm from './pages/CitaForm'
import ClienteFicha from './pages/ClienteFicha'
import ClienteForm from './pages/ClienteForm'
import Clientes from './pages/Clientes'
import Login from './pages/Login'
import Panel from './pages/Panel'
import PorVolver from './pages/PorVolver'
import Registro from './pages/Registro'

export default function App() {
  return (
    <Routes>
      <Route element={<SoloSinSesion />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
      </Route>
      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/inicio" element={<Panel />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/por-volver" element={<PorVolver />} />
        </Route>
        <Route path="/agenda/nueva" element={<CitaForm />} />
        <Route path="/agenda/:id" element={<CitaForm />} />
        <Route path="/clientes/nuevo" element={<ClienteForm />} />
        <Route path="/clientes/:id" element={<ClienteFicha />} />
        <Route path="/clientes/:id/editar" element={<ClienteForm />} />
      </Route>
      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  )
}
