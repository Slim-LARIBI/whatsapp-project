# WhatsFlow Runbook

Guide simple pour gérer et redéployer WhatsFlow sur le serveur.

---

# Stack d'exécution

WhatsFlow tourne en Docker avec 3 conteneurs principaux :

- `wa-api` → API NestJS
- `wa-web` → Frontend Next.js
- `wa-redis` → Redis utilisé pour la queue BullMQ

---

# Deploy rapide

### Rebuild API

À utiliser si tu modifies le backend (`apps/api`)

```bash
docker compose up -d --build api
```

### Rebuild Web

À utiliser si tu modifies le frontend (`apps/web`)

```bash
docker compose up -d --build web
```

### Rebuild complet

À utiliser si backend + frontend ont changé

```bash
docker compose up -d --build
```

---

# Commandes utiles

### Voir les conteneurs

```bash
docker compose ps
docker ps
```

### Voir les logs API

```bash
docker compose logs -f api
```

### Voir les logs Web

```bash
docker compose logs -f web
```

### Voir les logs Redis

```bash
docker compose logs -f redis
```

### Voir les dernières lignes des logs API

```bash
docker compose logs --tail=100 api
```

---

# Vérifications rapides

### Tester l'API

```bash
curl http://127.0.0.1:4000/api/health
```

### Tester le Web

```bash
curl http://127.0.0.1:3001
```

---

# Problèmes fréquents

### Message bloqué en pending

Vérifier :

```bash
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 redis
```

### Le frontend ne montre pas les changements

Rebuild web :

```bash
docker compose up -d --build web
```

Puis faire un hard refresh navigateur.

---

# Règles importantes

### À faire

- toujours utiliser Docker Compose
- rebuild API si tu modifies `apps/api`
- rebuild Web si tu modifies `apps/web`

### À ne pas faire

Ne jamais lancer l'API manuellement :

```bash
node apps/api/dist/main
```

Ne jamais utiliser :

```bash
nohup node apps/api/dist/main
```

Ne pas utiliser PM2 avec WhatsFlow. Docker gère déjà les processus.