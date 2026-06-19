import { useState, useRef, createContext, useContext, useCallback, type ReactNode } from 'react'

interface ConfirmOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [confirmText, setConfirmText] = useState('确认删除')
  const [cancelText, setCancelText] = useState('取消')
  const [danger, setDanger] = useState(true)
  const resolveRef = useRef<(v: boolean) => void>(() => {})

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
      setTitle(options.title)
      setDescription(options.description)
      setConfirmText(options.confirmText || '确认删除')
      setCancelText(options.cancelText || '取消')
      setDanger(options.danger !== false)
      setVisible(true)
    })
  }, [])

  const handleConfirm = () => {
    resolveRef.current(true)
    setVisible(false)
  }

  const handleCancel = () => {
    resolveRef.current(false)
    setVisible(false)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {visible && (
        <div className="cm-overlay" onClick={handleCancel}>
          <div className="cm-card" onClick={(e) => e.stopPropagation()}>
            <div className={`cm-icon ${danger ? 'danger' : ''}`}>
              {danger ? '⚠' : 'ℹ'}
            </div>
            <h3 className="cm-title">{title}</h3>
            <p className="cm-desc">{description}</p>
            <div className="cm-actions">
              <button className="admin-btn" onClick={handleCancel}>{cancelText}</button>
              <button className={danger ? 'admin-btn-danger' : 'admin-btn-primary'} onClick={handleConfirm}>
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}