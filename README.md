# ⚽ Tournament Manager

Application web de gestion de tournoi de football — classements par poule, meilleurs buteurs, calendrier des matchs, et panneau d'administration.

## Stack

| Couche | Technologie |
|---|---|
| Frontend | React 18 + Vite + React Router |
| Backend | Python 3.12 + FastAPI + SQLAlchemy async |
| Base de données | PostgreSQL 16 |
| Conteneurisation | Docker + Docker Compose |

---

## Démarrage rapide (Docker)

```bash
# 1. Cloner / placer le projet
cd tournament/

# 2. Lancer toute la stack
docker compose up --build

# 3. Ouvrir l'application
# Frontend : http://localhost:5173
# API docs : http://localhost:8000/docs
```

L'admin par défaut est créé automatiquement au démarrage :
- **Identifiant** : `admin`
- **Mot de passe** : `admin123`

> ⚠️ Changez ces valeurs dans `backend/.env` avant tout déploiement en production.

---

## Développement local (sans Docker)

### Backend

```bash
cd backend/

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Windows : venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer l'environnement
cp .env.example .env
# → Éditer .env avec votre URL PostgreSQL locale

# Lancer le serveur
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend/

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
# → http://localhost:5173
```

> Le frontend proxifie automatiquement `/api/*` vers `localhost:8000` via Vite (voir `vite.config.js`).

---

## Structure du projet

```
tournament/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── main.py               # App FastAPI, tables, admin seed
│   ├── requirements.txt
│   ├── .env                  # Variables d'environnement
│   └── app/
│       ├── config.py
│       ├── database.py
│       ├── auth.py           # JWT + bcrypt
│       ├── models/
│       │   └── models.py     # Group, Team, Player, Match, Goal, AdminUser
│       ├── schemas/
│       │   └── schemas.py    # Schémas Pydantic
│       └── routers/
│           ├── auth.py
│           ├── groups.py
│           ├── teams.py
│           ├── players.py
│           ├── matches.py
│           ├── goals.py
│           └── standings.py  # Classements + buteurs
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.css          # Design system
        ├── api/client.js      # Axios + tous les appels API
        ├── hooks/
        │   ├── useAuth.jsx    # Contexte auth
        │   └── useFetch.js    # Hook data fetching
        ├── components/
        │   ├── Navbar
        │   ├── Modal
        │   └── FormField
        └── pages/
            ├── Standings      # Classement par poule
            ├── Scorers        # Top buteurs
            ├── Calendar       # Calendrier avec filtres
            ├── Admin          # Panneau admin complet
            └── Login          # Connexion admin
```

---

## API REST

La documentation interactive est disponible sur **http://localhost:8000/docs** (Swagger UI).

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Connexion admin |
| GET | `/api/groups` | Public | Liste des poules |
| POST | `/api/groups` | Admin | Créer une poule |
| GET | `/api/teams` | Public | Liste des équipes |
| POST | `/api/teams` | Admin | Créer une équipe |
| GET | `/api/players` | Public | Liste des joueurs |
| POST | `/api/players` | Admin | Ajouter un joueur |
| GET | `/api/matches` | Public | Calendrier (filtres : team_id, week, stage) |
| POST | `/api/matches` | Admin | Créer un match |
| PUT | `/api/matches/{id}` | Admin | Mettre à jour le score |
| GET | `/api/goals` | Public | Liste des buts |
| POST | `/api/goals` | Admin | Enregistrer un but |
| GET | `/api/standings/groups` | Public | Classements par poule |
| GET | `/api/standings/scorers` | Public | Top buteurs |

---

## Workflow typique

1. **Admin → Poules** : Créer vos poules (ex: Poule A, Poule B…)
2. **Admin → Équipes** : Créer les équipes et les assigner aux poules
3. **Admin → Joueurs** : Ajouter les joueurs de chaque équipe
4. **Admin → Matchs** : Planifier les matchs (date, journée, phase)
5. **Admin → Matchs** : Saisir les scores après chaque match
6. **Admin → Buts** : Enregistrer les buteurs pour le classement

Les visiteurs peuvent consulter en temps réel :
- Le classement de chaque poule
- Le classement des meilleurs buteurs
- Le calendrier filtré par équipe ou journée

---

## Variables d'environnement

| Variable | Description | Défaut |
|---|---|---|
| `DATABASE_URL` | URL PostgreSQL async | — |
| `SECRET_KEY` | Clé de signature JWT | — |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Durée de session admin | 480 |
| `ADMIN_USERNAME` | Login admin | `admin` |
| `ADMIN_PASSWORD` | Mot de passe admin | `admin123` |
