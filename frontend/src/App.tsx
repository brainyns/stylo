import { Navigate, Route, Routes } from 'react-router'
import { RutaProtegida, SoloSinSesion } from './components/RutaProtegida'
import ClienteForm from './pages/ClienteForm'
import Clientes from './pages/Clientes'
import Login from './pages/Login'
import Registro from './pages/Registro'

export default function App() {
  return (
    <Routes>
      <Route element={<SoloSinSesion />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
      </Route>
      <Route element={<RutaProtegida />}>
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/nuevo" element={<ClienteForm />} />
        <Route path="/clientes/:id" element={<ClienteForm />} />
      </Route>
      <Route path="*" element={<Navigate to="/clientes" replace />} />
    </Routes>
  )
}
