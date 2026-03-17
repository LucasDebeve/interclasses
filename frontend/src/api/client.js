import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then((r) => r.data)

// Groups
export const getGroups = () => api.get('/groups').then((r) => r.data)
export const createGroup = (data) => api.post('/groups', data).then((r) => r.data)
export const deleteGroup = (id) => api.delete(`/groups/${id}`).then((r) => r.data)

// Teams
export const getTeams = () => api.get('/teams').then((r) => r.data)
export const createTeam = (data) => api.post('/teams', data).then((r) => r.data)
export const updateTeam = (id, data) => api.put(`/teams/${id}`, data).then((r) => r.data)
export const deleteTeam = (id) => api.delete(`/teams/${id}`).then((r) => r.data)

// Players
export const getPlayers = (teamId) =>
  api.get('/players', { params: teamId ? { team_id: teamId } : {} }).then((r) => r.data)
export const createPlayer = (data) => api.post('/players', data).then((r) => r.data)
export const importPlayers = (data) => api.post('/players/bulk/import', data).then((r) => r.data)
export const deletePlayer = (id) => api.delete(`/players/${id}`).then((r) => r.data)

// Matches
export const getMatches = (params = {}) => api.get('/matches', { params }).then((r) => r.data)
export const createMatch = (data) => api.post('/matches', data).then((r) => r.data)
export const updateMatch = (id, data) => api.put(`/matches/${id}`, data).then((r) => r.data)
export const deleteMatch = (id) => api.delete(`/matches/${id}`).then((r) => r.data)
export const importMatches = (data) => api.post('/matches/bulk/import', data).then((r) => r.data)

// Goals
export const getGoals = (matchId) =>
  api.get('/goals', { params: matchId ? { match_id: matchId } : {} }).then((r) => r.data)
export const createGoal = (data) => api.post('/goals', data).then((r) => r.data)
export const deleteGoal = (id) => api.delete(`/goals/${id}`).then((r) => r.data)

// Standings
export const getGroupStandings = () => api.get('/standings/groups').then((r) => r.data)
export const getTopScorers = () => api.get('/standings/scorers').then((r) => r.data)

// Prof Vs Eleves
export const getProfVsElevesConfig = () => api.get('/prof-vs-eleves').then((r) => r.data)
export const updateProfVsElevesConfig = (data) => api.put('/prof-vs-eleves', data).then((r) => r.data)

export default api
