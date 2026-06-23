import { useState, useRef, useCallback, createContext, useContext, type ReactNode } from 'react'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface ToastContextType {
  success: (msg: string) => void
  error: (msg: string) => void
  info: (msg: string) => void
  warning: (msg: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<ToastItem[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const remove = useCallback((id: number) => {
    setList((prev) => prev.filter((t) => t.id !== id))
    if (timers.current.has(id)) {
      clearTimeout(timers.current.get(id))
      timers.current.delete(id)
    }
  }, [])

  const add = useCallback((message: string, type: ToastItem['type']) => {
    const id = ++toastId
    setList((prev) => [...prev, { id, message, type }])
    const timer = setTimeout(() => remove(id), 3000)
    timers.current.set(id, timer)
  }, [remove])

  const toast = {
    success: (msg: string) => add(msg, 'success'),
    error: (msg: string) => add(msg, 'error'),
    info: (msg: string) => add(msg, 'info'),
    warning: (msg: string) => add(msg, 'warning'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {list.map((t) => (
          <div key={t.id} className={`toast-item ${t.type}`} onClick={() => remove(t.id)}>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : t.type === 'warning' ? '⚠' : 'ℹ'} {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}