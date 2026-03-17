import { useState, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { Navigate } from 'react-router-dom'
import Modal from '../components/Modal'
import FormField from '../components/FormField'
import {
  getGroups, createGroup, deleteGroup,
  getTeams, createTeam, updateTeam, deleteTeam,
  getPlayers, createPlayer, importPlayers, deletePlayer,
  getMatches, createMatch, updateMatch, deleteMatch, importMatches,
  getGoals, createGoal, deleteGoal,
} from '../api/client'
import { Plus, Trash2, Edit, Goal, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import './Admin.css'

const STAGES = [
  { value: 'group', label: 'Phase de poules' },
  { value: 'round_of_16', label: '1/8 de finale' },
  { value: 'quarter_final', label: 'Quart de finale' },
  { value: 'semi_final', label: 'Demi-finale' },
  { value: 'third_place', label: '3ème place' },
  { value: 'final', label: 'Finale' },
]

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = ['Poules', 'Équipes', 'Joueurs', 'Matchs', 'Buts']

// ── Groups Tab ────────────────────────────────────────────────────────────────
function GroupsTab() {
  const { data: groups, loading, reload } = useFetch(getGroups)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try { await createGroup({ name }); setName(''); reload() }
    finally { setSubmitting(false) }
  }

  return (
    <div className="admin-section">
      <form className="inline-form" onSubmit={handleCreate}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nom de la poule (ex: Poule A)"
          required
        />
        <button className="btn btn-primary" disabled={submitting}>
          <Plus size={14} /> Créer
        </button>
      </form>

      <div className="card">
        {loading && <div className="skeleton" style={{ height: 120 }} />}
        {groups?.length === 0 && <div className="empty-state">Aucune poule créée.</div>}
        {groups?.map(g => (
          <div key={g.id} className="list-row">
            <span className="list-name">{g.name}</span>
            <button className="btn btn-danger btn-sm" onClick={async () => { await deleteGroup(g.id); reload() }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Teams Tab ─────────────────────────────────────────────────────────────────
function TeamsTab() {
  const { data: teams, loading, reload } = useFetch(getTeams)
  const { data: groups } = useFetch(getGroups)
  const [form, setForm] = useState({ name: '', short_name: '', is_mixed: false, group_id: '' })
  const [editTeam, setEditTeam] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', short_name: '', is_mixed: false, group_id: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createTeam({ ...form, group_id: form.group_id ? +form.group_id : null })
      setForm({ name: '', short_name: '', is_mixed: false, group_id: '' })
      reload()
    } finally { setSubmitting(false) }
  }

  const handleEditOpen = (team) => {
    setEditTeam(team)
    setEditForm({
      name: team.name,
      short_name: team.short_name,
      is_mixed: team.is_mixed,
      group_id: team.group_id || ''
    })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await updateTeam(editTeam.id, { ...editForm, group_id: editForm.group_id ? +editForm.group_id : null })
      setEditTeam(null)
      reload()
    } finally { setSubmitting(false) }
  }

  return (
    <div className="admin-section">
      <form className="inline-form" onSubmit={handleCreate}>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom complet" required />
        <input value={form.short_name} onChange={e => setForm(f => ({ ...f, short_name: e.target.value }))} placeholder="Abrév. (3 car.)" maxLength={10} required style={{ maxWidth: 120 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.is_mixed} onChange={e => setForm(f => ({ ...f, is_mixed: e.target.checked }))} />
          <span>Équipe mixte</span>
        </label>
        <select value={form.group_id} onChange={e => setForm(f => ({ ...f, group_id: e.target.value }))}>
          <option value="">Poule (optionnel)</option>
          {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button className="btn btn-primary" disabled={submitting}><Plus size={14} /> Créer</button>
      </form>

      {editTeam && (
        <Modal title={`Modifier: ${editTeam.name}`} onClose={() => setEditTeam(null)}>
          <form className="form-grid" onSubmit={handleUpdate}>
            <FormField label="Nom complet *">
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
            </FormField>
            <FormField label="Abréviation *">
              <input value={editForm.short_name} onChange={e => setEditForm(f => ({ ...f, short_name: e.target.value }))} maxLength={10} required />
            </FormField>
            <FormField label="Équipe mixte">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={editForm.is_mixed} onChange={e => setEditForm(f => ({ ...f, is_mixed: e.target.checked }))} />
                <span>Oui</span>
              </label>
            </FormField>
            <FormField label="Poule">
              <select value={editForm.group_id} onChange={e => setEditForm(f => ({ ...f, group_id: e.target.value }))}>
                <option value="">Aucune</option>
                {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </FormField>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditTeam(null)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}

      <div className="card">
        {loading && <div className="skeleton" style={{ height: 160 }} />}
        {teams?.length === 0 && <div className="empty-state">Aucune équipe créée.</div>}
        {teams?.map(t => (
          <div key={t.id} className="list-row">
            <div>
              <span className="list-name">{t.name}</span>
              <span className="badge badge-gray" style={{ marginLeft: 8 }}>{t.short_name}</span>
              {t.is_mixed && (
                <span className="badge badge-accent" style={{ marginLeft: 6 }}>
                  Mixte
                </span>
              )}
              {t.group_id && groups && (
                <span className="badge badge-accent" style={{ marginLeft: 6 }}>
                  {groups.find(g => g.id === t.group_id)?.name}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleEditOpen(t)}>
                <Edit size={13} />
              </button>
              <button className="btn btn-danger btn-sm" onClick={async () => { await deleteTeam(t.id); reload() }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Players Tab ───────────────────────────────────────────────────────────────
function PlayersTab() {
  const { data: players, loading, reload } = useFetch(getPlayers)
  const { data: teams } = useFetch(getTeams)
  const [form, setForm] = useState({ name: '', number: '', team_id: '' })
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.team_id) return
    setSubmitting(true)
    try {
      await createPlayer({ name: form.name, number: form.number ? +form.number : null, team_id: +form.team_id })
      setForm({ name: '', number: '', team_id: form.team_id })
      reload()
    } finally { setSubmitting(false) }
  }

  const handleImport = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const result = await importPlayers({ data: importData })
      setImportResult(result)
      if (result.errors.length === 0) {
        setImportData('')
        setTimeout(() => {
          setShowImport(false)
          setImportResult(null)
          reload()
        }, 1500)
      }
    } finally { setSubmitting(false) }
  }

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <form className="inline-form" onSubmit={handleCreate} style={{ flex: 1 }}>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom du joueur" required />
          <input type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="N°" min={1} max={99} style={{ maxWidth: 80 }} />
          <select value={form.team_id} onChange={e => setForm(f => ({ ...f, team_id: e.target.value }))} required>
            <option value="">Équipe *</option>
            {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button className="btn btn-primary" disabled={submitting}><Plus size={14} /> Ajouter</button>
        </form>
        <button className="btn btn-secondary" onClick={() => setShowImport(true)}>Importer en masse</button>
      </div>

      {showImport && (
        <Modal title="Importer des joueurs" onClose={() => { setShowImport(false); setImportResult(null) }} size="lg">
          <form className="form-grid" onSubmit={handleImport}>
            <FormField label="Format: EQUIPE, NOM, NUMERO">
              <textarea
                value={importData}
                onChange={e => setImportData(e.target.value)}
                placeholder="Paris, Mbappé, 7&#10;Paris, Benzema, 9&#10;Lyon, Lacazette, 10"
                rows={10}
                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                required
              />
            </FormField>
            {importResult && (
              <div style={{
                padding: '1rem',
                backgroundColor: importResult.errors.length > 0 ? '#fff3cd' : '#d4edda',
                border: `1px solid ${importResult.errors.length > 0 ? '#ffc107' : '#28a745'}`,
                borderRadius: '0.25rem',
                marginTop: '1rem'
              }}>
                <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  ✓ {importResult.created} joueur(s) créé(s)
                </div>
                {importResult.errors.length > 0 && (
                  <div style={{ color: '#856404' }}>
                    {importResult.errors.map((err, i) => (
                      <div key={i} style={{ fontSize: '0.9rem' }}>⚠ {err}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => { setShowImport(false); setImportResult(null) }}>Fermer</button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !importData.trim()}>Importer</button>
            </div>
          </form>
        </Modal>
      )}

      <div className="card">
        {loading && <div className="skeleton" style={{ height: 200 }} />}
        {players?.length === 0 && <div className="empty-state">Aucun joueur enregistré.</div>}
        {players?.map(p => (
          <div key={p.id} className="list-row">
            <div>
              {p.number && <span className="player-number">#{p.number}</span>}
              <span className="list-name">{p.name}</span>
              <span className="badge badge-gray" style={{ marginLeft: 8 }}>{p.team_name}</span>
            </div>
            <button className="btn btn-danger btn-sm" onClick={async () => { await deletePlayer(p.id); reload() }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Matches Tab ───────────────────────────────────────────────────────────────
function MatchesTab() {
  const { data: matches, loading, reload } = useFetch(getMatches)
  const { data: teams } = useFetch(getTeams)
  const { data: groups } = useFetch(getGroups)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editMatch, setEditMatch] = useState(null)
  const [form, setForm] = useState({ home_team_id: '', away_team_id: '', match_date: '', week: '', stage: 'group', group_id: '', location: '' })
  const [scoreForm, setScoreForm] = useState({ home_score: '', away_score: '' })
  const [importData, setImportData] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createMatch({
        home_team_id: +form.home_team_id,
        away_team_id: +form.away_team_id,
        match_date: form.match_date || null,
        week: form.week ? +form.week : null,
        stage: form.stage,
        group_id: form.group_id ? +form.group_id : null,
        location: form.location || null,
      })
      setShowForm(false)
      setForm({ home_team_id: '', away_team_id: '', match_date: '', week: '', stage: 'group', group_id: '', location: '' })
      reload()
    } finally { setSubmitting(false) }
  }

  const handleScore = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await updateMatch(editMatch.id, {
        home_score: scoreForm.home_score !== '' ? +scoreForm.home_score : null,
        away_score: scoreForm.away_score !== '' ? +scoreForm.away_score : null,
        played: scoreForm.home_score !== '' && scoreForm.away_score !== '',
      })
      setEditMatch(null)
      reload()
    } finally { setSubmitting(false) }
  }

  const handleImport = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const result = await importMatches({ data: importData })
      setImportResult(result)
      if (result.errors.length === 0) {
        setImportData('')
        setTimeout(() => {
          setShowImport(false)
          setImportResult(null)
          reload()
        }, 1500)
      }
    } finally { setSubmitting(false) }
  }

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
          Importer en masse
        </button>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Nouveau match
        </button>
      </div>

      {showForm && (
        <Modal title="Créer un match" onClose={() => setShowForm(false)}>
          <form className="form-grid" onSubmit={handleCreate}>
            <div className="form-grid form-grid-2">
              <FormField label="Équipe domicile *">
                <select value={form.home_team_id} onChange={e => setForm(f => ({ ...f, home_team_id: e.target.value }))} required>
                  <option value="">Choisir…</option>
                  {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </FormField>
              <FormField label="Équipe extérieur *">
                <select value={form.away_team_id} onChange={e => setForm(f => ({ ...f, away_team_id: e.target.value }))} required>
                  <option value="">Choisir…</option>
                  {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </FormField>
            </div>
            <div className="form-grid form-grid-2">
              <FormField label="Date & heure">
                <input type="datetime-local" value={form.match_date} onChange={e => setForm(f => ({ ...f, match_date: e.target.value }))} />
              </FormField>
              <FormField label="Journée">
                <input type="number" min={1} value={form.week} onChange={e => setForm(f => ({ ...f, week: e.target.value }))} placeholder="ex: 1" />
              </FormField>
            </div>
            <div className="form-grid form-grid-2">
              <FormField label="Phase">
                <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                  {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </FormField>
              <FormField label="Poule">
                <select value={form.group_id} onChange={e => setForm(f => ({ ...f, group_id: e.target.value }))}>
                  <option value="">Aucune</option>
                  {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </FormField>
            </div>
            <FormField label="Lieu">
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Stade, ville…" />
            </FormField>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>Créer le match</button>
            </div>
          </form>
        </Modal>
      )}

      {showImport && (
        <Modal title="Importer des matchs" onClose={() => { setShowImport(false); setImportResult(null) }} size="lg">
          <form className="form-grid" onSubmit={handleImport}>
            <FormField label="Format: EQUIPE_A, EQUIPE_B, POULE, JOURNEE, DATE">
              <textarea
                value={importData}
                onChange={e => setImportData(e.target.value)}
                placeholder="Paris, Lyon, Poule A, 1, 2026-03-20&#10;Paris, Monaco, Poule A, 2, 2026-03-27&#10;Lyon, Monaco, Poule A, 3, 2026-04-03"
                rows={10}
                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                required
              />
            </FormField>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <strong>ℹ Heure par défaut:</strong> 12:05<br />
              <strong>Phase:</strong> Phase de poule<br />
              <strong>Formats de date:</strong> YYYY-MM-DD ou DD/MM/YYYY
            </div>
            {importResult && (
              <div style={{
                padding: '1rem',
                backgroundColor: importResult.errors.length > 0 ? '#fff3cd' : '#d4edda',
                border: `1px solid ${importResult.errors.length > 0 ? '#ffc107' : '#28a745'}`,
                borderRadius: '0.25rem',
                marginTop: '1rem'
              }}>
                <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  ✓ {importResult.created} match(s) créé(s)
                </div>
                {importResult.errors.length > 0 && (
                  <div style={{ color: '#856404' }}>
                    {importResult.errors.map((err, i) => (
                      <div key={i} style={{ fontSize: '0.9rem' }}>⚠ {err}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => { setShowImport(false); setImportResult(null) }}>Fermer</button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !importData.trim()}>Importer</button>
            </div>
          </form>
        </Modal>
      )}

      {editMatch && (
        <Modal title={`Score : ${editMatch.home_team_name} — ${editMatch.away_team_name}`} onClose={() => setEditMatch(null)} size="sm">
          <form className="form-grid" onSubmit={handleScore}>
            <div className="form-grid form-grid-2">
              <FormField label={editMatch.home_team_short}>
                <input type="number" min={0} value={scoreForm.home_score}
                  onChange={e => setScoreForm(f => ({ ...f, home_score: e.target.value }))} placeholder="0" />
              </FormField>
              <FormField label={editMatch.away_team_short}>
                <input type="number" min={0} value={scoreForm.away_score}
                  onChange={e => setScoreForm(f => ({ ...f, away_score: e.target.value }))} placeholder="0" />
              </FormField>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditMatch(null)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}

      <div className="card">
        {loading && <div className="skeleton" style={{ height: 200 }} />}
        {matches?.length === 0 && <div className="empty-state">Aucun match créé.</div>}
        <table>
          <thead>
            <tr>
              <th>Match</th>
              <th className="center">Score</th>
              <th className="center">Date</th>
              <th className="center">Phase</th>
              <th className="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches?.map(m => (
              <tr key={m.id}>
                <td>
                  <span className="match-teams-label">
                    {m.home_team_short} <span className="vs">vs</span> {m.away_team_short}
                  </span>
                  {m.group_name && <span className="badge badge-gray" style={{ marginLeft: 8 }}>{m.group_name}</span>}
                </td>
                <td className="center">
                  {m.played
                    ? <span className="score-pill">{m.home_score} — {m.away_score}</span>
                    : <span className="badge badge-gray">À jouer</span>}
                </td>
                <td className="center mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {m.match_date ? format(new Date(m.match_date), 'dd/MM HH:mm') : '—'}
                </td>
                <td className="center">
                  <span className="badge badge-gray">{STAGES.find(s => s.value === m.stage)?.label || m.stage}</span>
                </td>
                <td className="right">
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setEditMatch(m); setScoreForm({ home_score: m.home_score ?? '', away_score: m.away_score ?? '' }) }}
                    >
                      <Edit size={13} /> Score
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={async () => { await deleteMatch(m.id); reload() }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Goals Tab ─────────────────────────────────────────────────────────────────
function GoalsTab() {
  const { data: goals, loading, reload } = useFetch(getGoals)
  const { data: matches } = useFetch(getMatches)
  const { data: players } = useFetch(getPlayers)
  const { data: teams } = useFetch(getTeams)
  const [form, setForm] = useState({ match_id: '', scorer_id: '', minute: '', is_own_goal: false, is_penalty: false })
  const [filteredPlayers, setFilteredPlayers] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const handleMatchChange = (matchId) => {
    const match = matches?.find(m => m.id === +matchId)
    if (match && players) {
      const ids = [match.home_team_id, match.away_team_id]
      setFilteredPlayers(players.filter(p => ids.includes(p.team_id)))
    } else {
      setFilteredPlayers([])
    }
    setForm(f => ({ ...f, match_id: matchId, scorer_id: '' }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createGoal({
        match_id: +form.match_id,
        scorer_id: +form.scorer_id,
        minute: form.minute ? +form.minute : null,
        is_own_goal: form.is_own_goal,
        is_penalty: form.is_penalty,
      })
      setForm(f => ({ ...f, scorer_id: '', minute: '', is_own_goal: false, is_penalty: false }))
      reload()
    } finally { setSubmitting(false) }
  }

  const playedMatches = matches?.filter(m => m.played) || []

  return (
    <div className="admin-section">
      <form className="inline-form goals-form" onSubmit={handleCreate}>
        <select value={form.match_id} onChange={e => handleMatchChange(e.target.value)} required>
          <option value="">Match *</option>
          {playedMatches.map(m => (
            <option key={m.id} value={m.id}>
              {m.home_team_short} {m.home_score}–{m.away_score} {m.away_team_short}
            </option>
          ))}
        </select>
        <select value={form.scorer_id} onChange={e => setForm(f => ({ ...f, scorer_id: e.target.value }))} required disabled={!form.match_id}>
          <option value="">Joueur *</option>
          {filteredPlayers.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.team_name})</option>
          ))}
        </select>
        <input type="number" min={1} max={120} value={form.minute} onChange={e => setForm(f => ({ ...f, minute: e.target.value }))} placeholder="Min." style={{ maxWidth: 80 }} />
        <label className="checkbox-label">
          <input type="checkbox" checked={form.is_penalty} onChange={e => setForm(f => ({ ...f, is_penalty: e.target.checked }))} />
          Pén.
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={form.is_own_goal} onChange={e => setForm(f => ({ ...f, is_own_goal: e.target.checked }))} />
          CSC
        </label>
        <button className="btn btn-primary" disabled={submitting}><Plus size={14} /> Ajouter</button>
      </form>

      <div className="card">
        {loading && <div className="skeleton" style={{ height: 160 }} />}
        {goals?.length === 0 && <div className="empty-state">Aucun but enregistré.</div>}
        <table>
          <thead>
            <tr>
              <th>Buteur</th>
              <th>Équipe</th>
              <th>Match</th>
              <th className="center">Min.</th>
              <th className="center">Type</th>
              <th className="right">Action</th>
            </tr>
          </thead>
          <tbody>
            {goals?.map(g => {
              const match = matches?.find(m => m.id === g.match_id)
              return (
                <tr key={g.id}>
                  <td className="list-name">{g.scorer_name}</td>
                  <td><span className="badge badge-gray">{g.team_name}</span></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {match ? `${match.home_team_short} vs ${match.away_team_short}` : `Match #${g.match_id}`}
                  </td>
                  <td className="center mono">{g.minute ? `${g.minute}'` : '—'}</td>
                  <td className="center">
                    {g.is_own_goal && <span className="badge badge-red">CSC</span>}
                    {g.is_penalty && <span className="badge badge-yellow">Pén.</span>}
                    {!g.is_own_goal && !g.is_penalty && <span className="badge badge-accent">But</span>}
                  </td>
                  <td className="right">
                    <button className="btn btn-danger btn-sm" onClick={async () => { await deleteGoal(g.id); reload() }}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Admin Page ────────────────────────────────────────────────────────────────
export default function Admin() {
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState(0)

  if (!isAdmin) return <Navigate to="/login" replace />

  const TabComponents = [GroupsTab, TeamsTab, PlayersTab, MatchesTab, GoalsTab]
  const ActiveTab = TabComponents[tab]

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Panneau d'administration</h1>
        <p className="page-subtitle">Gérez le tournoi : poules, équipes, joueurs, matchs et buts</p>
      </div>

      <div className="admin-tabs">
        {TABS.map((label, i) => (
          <button
            key={label}
            className={`admin-tab ${tab === i ? 'active' : ''}`}
            onClick={() => setTab(i)}
          >
            {label}
          </button>
        ))}
      </div>

      <ActiveTab />
    </div>
  )
}
