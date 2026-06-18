import { useState, useEffect } from 'react'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { isLoggedIn } from './services/github'
import './styles.css'

export function isLocalMode(): boolean {
  return localStorage.getItem('starmap_local_mode') === 'true'
}

export default function AdminApp() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  if (!ready) return null

  const logged = isLoggedIn() || isLocalMode()

  if (!logged) return <Login onSuccess={() => setReady(false)} />

  return <Dashboard onLogout={() => {
    localStorage.removeItem('starmap_local_mode')
    localStorage.removeItem('starmap_token')
    setReady(false)
  }} />
}
