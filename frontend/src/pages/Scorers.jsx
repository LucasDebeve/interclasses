import { useFetch } from '../hooks/useFetch'
import { getTopScorers } from '../api/client'
import { Target } from 'lucide-react'
import './Scorers.css'

export default function Scorers() {
  const { data, loading, error } = useFetch(getTopScorers)

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Classement des buteurs</h1>
        <p className="page-subtitle">Tous les buteurs du tournoi, buts contre son camp exclus</p>
      </div>

      <div className="card animate-fade-up">
        {loading && <div className="skeleton" style={{ height: 300 }} />}
        {error && <div className="error-msg">{error}</div>}
        {data && (
          <>
            {data.length === 0 ? (
              <div className="empty-state">Aucun but enregistré pour l'instant.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th className="center">#</th>
                    <th>Joueur</th>
                    <th>Équipe</th>
                    <th className="center">Buts</th>
                    <th className="center">Pén.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((scorer, i) => (
                    <tr key={scorer.player_id} className={`scorer-row ${i === 0 ? 'top-scorer' : ''}`}>
                      <td className="center">
                        {i === 0 ? (
                          <span className="scorer-trophy">🏆</span>
                        ) : (
                          <span className="rank">{i + 1}</span>
                        )}
                      </td>
                      <td>
                        <span className="scorer-name">{scorer.player_name}</span>
                      </td>
                      <td>
                        <span className="badge badge-gray">{scorer.team_short}</span>
                      </td>
                      <td className="center">
                        <div className="goals-cell">
                          <div
                            className="goals-bar"
                            style={{ width: `${(scorer.goals / data[0].goals) * 100}%` }}
                          />
                          <span className="goals-count">{scorer.goals}</span>
                        </div>
                      </td>
                      <td className="center mono text-muted">
                        {scorer.penalties > 0 ? scorer.penalties : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  )
}
