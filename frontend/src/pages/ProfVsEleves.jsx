import { useState } from 'react'
import { Edit } from 'lucide-react'
import { useFetch } from '../hooks/useFetch'
import { useAuth } from '../hooks/useAuth'
import { getProfVsElevesConfig, updateProfVsElevesConfig } from '../api/client'
import Modal from '../components/Modal'
import './ProfVsEleves.css'

export default function ProfVsEleves() {
  const { isAdmin } = useAuth()
  const { data, loading, error, reload } = useFetch(getProfVsElevesConfig)
  const [showEdit, setShowEdit] = useState(false)
  const [profsForm, setProfsForm] = useState([])
  const [substitutesText, setSubstitutesText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [saveError, setSaveError] = useState('')

  const profs = data?.profs || []
  const substitutes = data?.substitutes || []

  const openEdit = () => {
    setProfsForm(profs.map((p) => ({ ...p })))
    setSubstitutesText(substitutes.join('\n'))
    setSaveError('')
    setShowEdit(true)
  }

  const updateProfField = (idx, field, value) => {
    setProfsForm((prev) => prev.map((p, i) => {
      if (i !== idx) return p
      return { ...p, [field]: value }
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaveError('')
    setSubmitting(true)
    try {
      const payload = {
        profs: profsForm.map((p) => ({
          number: Number(p.number),
          name: String(p.name || '').trim(),
          role: String(p.role || '').trim(),
          x: Number(p.x),
          y: Number(p.y),
        })),
        substitutes: substitutesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      }
      await updateProfVsElevesConfig(payload)
      setShowEdit(false)
      reload()
    } catch (err) {
      setSaveError(err?.response?.data?.detail || 'Erreur lors de la sauvegarde')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Prof vs eleves</h1>
        <p className="page-subtitle">Composition pour la rencontre speciale</p>
      </div>

      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.8rem' }}>
          <button className="btn btn-secondary" onClick={openEdit}>
            <Edit size={14} /> Modifier composition
          </button>
        </div>
      )}

      <div className="card pve-card animate-fade-up">
        {loading && <div className="skeleton" style={{ height: 220 }} />}
        {error && <div className="error-msg">{error}</div>}

        {!loading && !error && (
          <>
        <div className="pve-section">
          <h2 className="pve-title">Composition</h2>

          <div className="pve-pitch">
            <div className="pve-goal" />
            <div className="pve-box" />
            <div className="pve-center-line" />

            {profs.map((player) => (
              <div
                key={`prof-${player.number}`}
                className="pve-node profs"
                style={{ left: `${player.x}%`, top: `${player.y}%` }}
              >
                <span className="pve-node-number">{player.number}</span>
                <span className="pve-node-name">{player.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pve-section">
          <h2 className="pve-title">Remplacants ({substitutes.length})</h2>
          <div className="pve-bench">
            {substitutes.map((name) => (
              <span key={name} className="badge badge-gray">{name}</span>
            ))}
          </div>
        </div>
          </>
        )}
      </div>

      {isAdmin && showEdit && (
        <Modal title="Modifier la composition des profs" onClose={() => setShowEdit(false)} size="lg">
          <form className="form-grid" onSubmit={handleSave}>
            <div className="pve-edit-grid">
              {profsForm.map((player, idx) => (
                <div key={`edit-${idx}`} className="pve-edit-card">
                  <div className="pve-edit-row pve-edit-row-2">
                    <label>
                      Numero
                      <input
                        type="number"
                        value={player.number}
                        onChange={(e) => updateProfField(idx, 'number', e.target.value)}
                        min={1}
                        required
                      />
                    </label>
                    <label>
                      Role
                      <input
                        value={player.role}
                        onChange={(e) => updateProfField(idx, 'role', e.target.value)}
                        required
                      />
                    </label>
                  </div>
                  <label>
                    Nom
                    <input
                      value={player.name}
                      onChange={(e) => updateProfField(idx, 'name', e.target.value)}
                      required
                    />
                  </label>
                  <div className="pve-edit-row pve-edit-row-2">
                    <label>
                      X (0-100)
                      <input
                        type="number"
                        value={player.x}
                        onChange={(e) => updateProfField(idx, 'x', e.target.value)}
                        min={0}
                        max={100}
                        step={1}
                        required
                      />
                    </label>
                    <label>
                      Y (0-100)
                      <input
                        type="number"
                        value={player.y}
                        onChange={(e) => updateProfField(idx, 'y', e.target.value)}
                        min={0}
                        max={100}
                        step={1}
                        required
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <label>
              Remplacants (un par ligne)
              <textarea
                rows={5}
                value={substitutesText}
                onChange={(e) => setSubstitutesText(e.target.value)}
                placeholder={'Remplacant A\nRemplacant B'}
              />
            </label>

            {saveError && <div className="error-msg">{saveError}</div>}

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowEdit(false)}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                Enregistrer
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
