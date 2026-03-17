import { useState, useMemo } from 'react'
import { useFetch } from '../hooks/useFetch'
import { getMatches, getTeams } from '../api/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronDown, Filter } from 'lucide-react'
import './Calendar.css'

const STAGE_LABELS = {
  group: 'Phase de poules',
  round_of_16: '1/8 de finale',
  quarter_final: 'Quart de finale',
  semi_final: 'Demi-finale',
  third_place: 'Match pour la 3ème place',
  final: 'Finale',
}

function MatchCard({ match }) {
  const played = match.played
  const date = match.match_date ? new Date(match.match_date) : null

  return (
    <div className={`match-card ${played ? 'played' : 'upcoming'}`}>
      <div className="match-meta">
        {date && (
          <span className="match-date">
            {format(date, 'EEE d MMM · HH:mm', { locale: fr })}
          </span>
        )}
        {match.group_name && (
          <span className="badge badge-gray">{match.group_name}</span>
        )}
        <span className="badge badge-gray">{STAGE_LABELS[match.stage] || match.stage}</span>
        {match.location && <span className="match-location">📍 {match.location}</span>}
      </div>

      <div className="match-teams">
        <div className={`match-team ${played && match.home_score > match.away_score ? 'winner' : ''}`}>
          <span className="team-label">{match.home_team_name}</span>
          <span className="team-short-label">{match.home_team_short}</span>
        </div>

        <div className="match-score">
          {played ? (
            <>
              <span className="score">{match.home_score}</span>
              <span className="score-sep">—</span>
              <span className="score">{match.away_score}</span>
            </>
          ) : (
            <span className="score-tbd">VS</span>
          )}
        </div>

        <div className={`match-team away ${played && match.away_score > match.home_score ? 'winner' : ''}`}>
          <span className="team-label">{match.away_team_name}</span>
          <span className="team-short-label">{match.away_team_short}</span>
        </div>
      </div>
    </div>
  )
}

export default function Calendar() {
  const { data: matches, loading: loadingMatches } = useFetch(getMatches)
  const { data: teams } = useFetch(getTeams)

  const [filterTeam, setFilterTeam] = useState('')
  const [filterWeek, setFilterWeek] = useState('')
  const [filterStage, setFilterStage] = useState('')

  const weeks = useMemo(() => {
    if (!matches) return []
    const ws = [...new Set(matches.map(m => m.week).filter(Boolean))].sort((a, b) => a - b)
    return ws
  }, [matches])

  const stages = useMemo(() => {
    if (!matches) return []
    return [...new Set(matches.map(m => m.stage))]
  }, [matches])

  const filtered = useMemo(() => {
    if (!matches) return {}
    let ms = matches
    if (filterTeam) ms = ms.filter(m => m.home_team_id === +filterTeam || m.away_team_id === +filterTeam)
    if (filterWeek) ms = ms.filter(m => m.week === +filterWeek)
    if (filterStage) ms = ms.filter(m => m.stage === filterStage)

    // Group by week, then by stage for knockout
    const groups = {}
    ms.forEach(m => {
      const key = m.week ? `Journée ${m.week}` : (STAGE_LABELS[m.stage] || m.stage)
      if (!groups[key]) groups[key] = []
      groups[key].push(m)
    })
    return groups
  }, [matches, filterTeam, filterWeek, filterStage])

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Calendrier des matchs</h1>
        <p className="page-subtitle">Filtrez par équipe, journée ou phase</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <Filter size={14} className="filter-icon" />

        <div className="filter-select-wrap">
          <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
            <option value="">Toutes les équipes</option>
            {teams?.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-select-wrap">
          <select value={filterWeek} onChange={e => setFilterWeek(e.target.value)}>
            <option value="">Toutes les journées</option>
            {weeks.map(w => (
              <option key={w} value={w}>Journée {w}</option>
            ))}
          </select>
        </div>

        <div className="filter-select-wrap">
          <select value={filterStage} onChange={e => setFilterStage(e.target.value)}>
            <option value="">Toutes les phases</option>
            {stages.map(s => (
              <option key={s} value={s}>{STAGE_LABELS[s] || s}</option>
            ))}
          </select>
        </div>

        {(filterTeam || filterWeek || filterStage) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setFilterTeam(''); setFilterWeek(''); setFilterStage('') }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      {loadingMatches && (
        <div className="calendar-col">
          {[1,2,3].map(i => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 8 }} />
          ))}
        </div>
      )}

      {!loadingMatches && Object.keys(filtered).length === 0 && (
        <div className="empty-page">
          <p>Aucun match trouvé.</p>
          <p className="text-muted">Ajustez vos filtres ou créez des matchs depuis l'admin.</p>
        </div>
      )}

      <div className="calendar-col">
        {Object.entries(filtered).map(([week, ms]) => (
          <div key={week} className="week-section animate-fade-up">
            <div className="week-label">{week}</div>
            <div className="week-matches">
              {ms.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
