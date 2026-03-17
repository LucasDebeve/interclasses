import { useFetch } from '../hooks/useFetch'
import { getGroupStandings } from '../api/client'
import './Standings.css'

function StandingRow({ team, rank }) {
  const promotionZone = rank <= 2
  return (
    <tr className={`standing-row ${promotionZone ? 'promotion' : ''}`}>
      <td className="center">
        <span className={`rank ${promotionZone ? 'rank-top' : ''}`}>{rank}</span>
      </td>
      <td>
        <span className="team-name">{team.team_name}</span>
        <span className="team-short">{team.team_short}</span>
      </td>
      <td className="center mono">{team.played}</td>
      <td className="center mono">{team.won}</td>
      <td className="center mono">{team.drawn}</td>
      <td className="center mono">{team.lost}</td>
      <td className="center mono">{team.goals_for}:{team.goals_against}</td>
      <td className={`center mono gd ${team.goal_difference > 0 ? 'pos' : team.goal_difference < 0 ? 'neg' : ''}`}>
        {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
      </td>
      <td className="center">
        <strong className="points">{team.points}</strong>
      </td>
    </tr>
  )
}

function GroupTable({ group }) {
  return (
    <div className="card animate-fade-up group-card">
      <div className="card-header">
        <span className="card-title">{group.group_name}</span>
        <span className="badge badge-accent">{group.standings.length} équipes</span>
      </div>
      {group.standings.length === 0 ? (
        <div className="empty-state">Aucune équipe dans cette poule</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th className="center">#</th>
              <th>Équipe</th>
              <th className="center" title="Matchs joués">J</th>
              <th className="center" title="Victoires">V</th>
              <th className="center" title="Nuls">N</th>
              <th className="center" title="Défaites">D</th>
              <th className="center">B</th>
              <th className="center" title="Différence de buts">+/-</th>
              <th className="center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {group.standings.map((team, i) => (
              <StandingRow key={team.team_id} team={team} rank={i + 1} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function Standings() {
  const { data, loading, error } = useFetch(getGroupStandings)

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Classement par poule</h1>
        <p className="page-subtitle">Phase de groupes — les 2 premiers de chaque poule sont qualifiés</p>
      </div>

      {loading && (
        <div className="standings-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card" style={{ height: 280 }}>
              <div className="skeleton" style={{ height: '100%' }} />
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      {data && (
        <>
          {data.length === 0 ? (
            <div className="empty-page">
              <p>Aucune poule configurée.</p>
              <p className="text-muted">Créez des poules et des équipes depuis le panneau admin.</p>
            </div>
          ) : (
            <div className="standings-grid">
              {data.map((group) => (
                <GroupTable key={group.group_id} group={group} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
