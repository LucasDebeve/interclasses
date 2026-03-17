import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const isAdmin = !!token

  const login = async (username, password) => {
    const data = await apiLogin(username, password)
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
