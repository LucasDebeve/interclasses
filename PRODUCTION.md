# Mise en production (VPS + Caddy)

Ce document décrit une mise en prod sans perturber les autres sites deja servis par Caddy.

## 1. Fichiers utilises

- `docker-compose.yml` (base)
- `docker-compose.prod.yml` (surcharge prod)
- `backend/.env.prod` (secrets prod, non committe)
- `deploy/caddy/tournament.Caddyfile` (bloc Caddy a integrer)

## 2. Preparer les secrets

Sur le VPS, depuis la racine du projet:

```bash
cp backend/.env.prod.example backend/.env.prod
```

Edite `backend/.env.prod` et remplace toutes les valeurs `REPLACE_ME...`.

## 3. Variable shell requise pour PostgreSQL

Le mot de passe DB est injecte via variable shell pour eviter de le commiter.

```bash
export POSTGRES_PASSWORD='met-un-mot-de-passe-fort'
```

## 4. Lancer en production

```bash
chmod +x scripts/deploy-prod.sh
POSTGRES_PASSWORD="$POSTGRES_PASSWORD" ./scripts/deploy-prod.sh
```

Verification:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 backend
```

## 5. Brancher Caddy

1. Ouvre ton Caddyfile principal.
2. Copie le bloc de `deploy/caddy/tournament.Caddyfile`.
3. Remplace le domaine exemple par ton vrai domaine.
4. Recharge Caddy:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## 6. Exposition reseau en prod

- `frontend`: expose uniquement `127.0.0.1:15173` (accessible par Caddy local)
- `backend`: non expose au public
- `db`: non expose au public

## 7. Commandes utiles

Redemarrage:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart
```

Mise a jour:

```bash
git pull
POSTGRES_PASSWORD="$POSTGRES_PASSWORD" ./scripts/deploy-prod.sh
```

Arret:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## 8. Sauvegarde base de donnees

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db \
  pg_dump -U tournament tournament_db > backup_$(date +%F).sql
```

Restauration:

```bash
cat backup_YYYY-MM-DD.sql | docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db \
  psql -U tournament -d tournament_db
```
