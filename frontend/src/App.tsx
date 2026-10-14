import { Navigate, Route, Routes } from 'react-router'
import { RutaProtegida, SoloSinSesion } from './components/RutaProtegida'
import ClientaForm from './pages/ClientaForm'
import Clientas from './pages/Clientas'
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
        <Route path="/clientas" element={<Clientas />} />
        <Route path="/clientas/nueva" element={<ClientaForm />} />
        <Route path="/clientas/:id" element={<ClientaForm />} />
      </Route>
      <Route path="*" element={<Navigate to="/clientas" replace />} />
    </Routes>
  )
}
