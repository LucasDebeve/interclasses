import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Standings from './pages/Standings'
import Scorers from './pages/Scorers'
import Calendar from './pages/Calendar'
import ProfVsEleves from './pages/ProfVsEleves'
import Admin from './pages/Admin'
import Login from './pages/Login'
import './pages/Page.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"         element={<Standings />} />
          <Route path="/scorers"  element={<Scorers />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/prof-vs-eleves" element={<ProfVsEleves />} />
          <Route path="/admin"    element={<Admin />} />
          <Route path="/login"    element={<Login />} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
