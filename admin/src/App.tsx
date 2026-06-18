import { useState, useEffect } from 'react'
import { AuthPage } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'

export default function AdminApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('starmap_github_token')
    if (token) setIsLoggedIn(true)
  }, [])

  if (!isLoggedIn) {
    return <AuthPage onLogin={() => setIsLoggedIn(true)} />
  }

  return <Dashboard />
}
