import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Trophy, Calendar, BarChart3, Users, Settings, LogOut, LogIn, Menu, X } from 'lucide-react'
import './Navbar.css'

const navItems = [
  { to: '/',          label: 'Classements', icon: BarChart3 },
  { to: '/scorers',   label: 'Buteurs',     icon: Trophy },
  { to: '/calendar',  label: 'Calendrier',  icon: Calendar },
  { to: '/prof-vs-eleves', label: 'Prof vs eleves', icon: Users },
]

export default function Navbar() {
  const { isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleCloseMenu = () => setIsMenuOpen(false)

  const handleAuthAction = () => {
    handleCloseMenu()
    if (isAdmin) {
      logout()
      navigate('/')
      return
    }
    navigate('/login')
  }

  const authButtonLabel = isAdmin ? 'Deconnexion' : 'Admin'
  const AuthIcon = isAdmin ? LogOut : LogIn

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">⚽</span>
        <span className="navbar-title">INTERCLASSES</span>
      </div>

      <button
        className="navbar-menu-toggle"
        type="button"
        aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={isMenuOpen}
        aria-controls="main-navigation"
        onClick={() => setIsMenuOpen(v => !v)}
      >
        {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <nav id="main-navigation" className={`navbar-nav ${isMenuOpen ? 'open' : ''}`}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleCloseMenu}
          >
            <Icon size={15} />
            <span>{label}</span>
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleCloseMenu}
          >
            <Settings size={15} />
            <span>Admin</span>
          </NavLink>
        )}

        <button className="nav-mobile-auth" onClick={handleAuthAction}>
          <AuthIcon size={14} />
          <span>{authButtonLabel}</span>
        </button>
      </nav>

      <div className="navbar-actions">
        <button className="btn btn-ghost btn-sm" onClick={handleAuthAction}>
          <AuthIcon size={14} />
          {authButtonLabel}
        </button>
      </div>
    </header>
  )
}
