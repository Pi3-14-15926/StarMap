import React from 'react'
import ReactDOM from 'react-dom/client'
import AdminApp from './App'

/* 导入 UI 设计系统 Tokens */
import '../../packages/ui/src/styles/tokens.css'
import '../../packages/ui/src/styles/reset.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
)
