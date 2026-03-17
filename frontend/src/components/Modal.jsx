import { useEffect } from 'react'
import { X } from 'lucide-react'
import './Modal.css'

export default function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => {
    const handle = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
