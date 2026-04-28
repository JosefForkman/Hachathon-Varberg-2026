import { useEffect, useState } from 'react'
import { getStoredEmail, setStoredEmail, isValidEmail } from './utils/storage.js'

const COPY = {
  premium: {
    icon: '📊',
    title: 'Unlock the full report',
    sub: 'Drop your email to download the deep-analysis report (PDF + GeoJSON + CSV) with all parks, scores, and trends.',
    cta: 'Get the report',
    success: 'Report unlocked! Check your inbox in a moment.',
  },
  demo: {
    icon: '🎯',
    title: 'Request a demo',
    sub: "We'll reach out within 24 hours to walk you through Sweden Atlas for your team or organization.",
    cta: 'Request demo',
    success: "Thanks! We'll be in touch soon.",
  },
}

export default function EmailGate({ open, reason, onClose }) {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setDone(false)
      setError('')
      const existing = getStoredEmail()
      setEmail(existing || '')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const copy = COPY[reason] || COPY.premium

  function onSubmit(e) {
    e.preventDefault()
    if (!isValidEmail(email)) {
      setError('Please enter a valid email')
      return
    }
    setStoredEmail(email.trim())
    setDone(true)
    setTimeout(() => onClose(), 1600)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal__wrap" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        <div className="modal">
          {done ? (
            <div className="modal__success">
              <div className="modal__success-icon">✅</div>
              <div className="modal__title">{copy.success}</div>
            </div>
          ) : (
            <>
              <div className="modal__icon">{copy.icon}</div>
              <h3 className="modal__title">{copy.title}</h3>
              <p className="modal__sub">{copy.sub}</p>
              <form className="modal__form" onSubmit={onSubmit}>
                <input
                  className="modal__input"
                  type="email"
                  placeholder="you@organization.se"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  autoFocus
                  required
                />
                {error && (
                  <div style={{ color: '#F87171', fontSize: 12, marginTop: -4 }}>{error}</div>
                )}
                <button type="submit" className="btn btn--primary modal__submit">
                  {copy.cta}
                </button>
                <div className="modal__hint">
                  We respect your inbox. No spam, no resale, unsubscribe anytime.
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
