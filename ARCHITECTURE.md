# Architecture de l'application

## 🏗️ Structure Backend

### Fonctions Serverless (Vercel)

Tout le backend est dans `project/api/` sous forme de fonctions serverless :

#### 1. `/api/searchCompanies`
- **Rôle** : Recherche d'entreprises réelles
- **Source** : API Recherche Entreprises (gouvernement français)
- **Méthode** : POST
- **Paramètres** :
  ```json
  {
    "city": "Paris",
    "apeCodeOrName": "5610A" // optionnel
  }
  ```
- **Retour** :
  ```json
  {
    "companies": [...],
    "error": "..." // optionnel
  }
  ```

#### 2. `/api/checkWebsite`
- **Rôle** : Vérifie l'existence d'un site web
- **Source** : Google Places API
- **Méthode** : POST
- **Paramètres** :
  ```json
  {
    "name": "Nom entreprise",
    "city": "Paris",
    "address": "Adresse complète"
  }
  ```
- **Retour** :
  ```json
  {
    "hasWebsite": true/false,
    "website": "https://..." // optionnel
  }
  ```

## 🔄 Flux de données

```
Frontend (React)
    ↓
    ├─→ /api/searchCompanies → API Sirene (gouvernement)
    │
    └─→ /api/checkWebsite → Google Places API
```

## ✅ Configuration nécessaire

### Variables d'environnement

**Local (.env.local)** :
```
GOOGLE_PLACES_API_KEY=AIzaSyCa3HwCzuRqgeXnD7EieVk7QeBHBeWARlA
```

**Vercel (Production)** :
- Ajoutez dans Settings > Environment Variables
- `GOOGLE_PLACES_API_KEY` = `AIzaSyCa3HwCzuRqgeXnD7EieVk7QeBHBeWARlA`

## 🚀 Déploiement

### Développement local
```bash
cd project
vercel dev
```

### Production
```bash
cd project
vercel --prod
```

## 📦 Pas de backend traditionnel

**Pourquoi ?**
- Les fonctions serverless suffisent
- Pas besoin de base de données (API externe)
- Pas besoin de serveur Node.js séparé
- Scalabilité automatique
- Coût réduit

**Si vous avez besoin d'un backend traditionnel :**
- Créez un serveur Express/FastAPI dans `backend/`
- Modifiez les appels API dans le frontend
- Déployez sur Railway/Render/Heroku

Mais pour cette app, **les fonctions serverless sont parfaites** ! ✨

