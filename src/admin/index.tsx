import { useState, useEffect } from 'react'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { isLoggedIn } from './services/github'
import './styles.css'

export default function AdminApp() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => { setLoggedIn(isLoggedIn()) }, [])

  if (!loggedIn) return <Login onSuccess={() => setLoggedIn(true)} />
  return <Dashboard onLogout={() => setLoggedIn(false)} />
}
