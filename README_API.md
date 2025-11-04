# Configuration de l'API de vérification de sites web

## Fonctionnalités implémentées

### 1. Formulaire de recherche
- ✅ Champ "Ville"
- ✅ Champ "Code APE" ou "Nom entreprise"
- ✅ Bouton "Rechercher"

### 2. Gestion de l'état
- ✅ `searchParams` → contient ville et code APE/nom
- ✅ `results` → tableau des entreprises avec le statut "site web"
- ✅ `loading` → booléen pour afficher un loader pendant la recherche
- ✅ `isScanning` → booléen pour le scan des sites web
- ✅ `scanProgress` → pourcentage de progression du scan

### 3. Appel API serverless
- ✅ Fonction `/api/checkWebsite` créée
- ✅ Appel pour chaque entreprise trouvée
- ✅ Mise à jour du tableau avec les statuts ✅ ou ❌

### 4. Export CSV
- ✅ Bouton "Exporter CSV" qui télécharge les résultats affichés

### 5. Composants visuels
- ✅ Tableau responsive
- ✅ Cartes (Card) pour chaque section
- ✅ Loader animé
- ✅ Barre de progression pour le scan des entreprises

## Configuration

### Variables d'environnement

Pour utiliser Google Places API, la clé a été fournie. 

**Configuration locale** : Créez un fichier `.env.local` avec :
```
GOOGLE_PLACES_API_KEY=AIzaSyCa3HwCzuRqgeXnD7EieVk7QeBHBeWARlA
```

**Configuration Vercel** : 
1. Allez dans Settings > Environment Variables
2. Ajoutez `GOOGLE_PLACES_API_KEY` avec la valeur fournie
3. Redéployez l'application

Sans cette clé, l'API utilisera une méthode de fallback qui vérifie l'existence d'un domaine probable.

### Déploiement sur Vercel

1. Connectez votre projet à Vercel
2. Ajoutez la variable d'environnement `GOOGLE_PLACES_API_KEY` si vous utilisez Google Places API
3. Déployez le projet

### Développement local

Pour tester l'API en local, vous pouvez utiliser `vercel dev` :

```bash
npm install -g vercel
vercel dev
```

## Flux de fonctionnement

1. L'utilisateur remplit le formulaire (Ville + Code APE/Nom)
2. Le frontend filtre les entreprises mockées selon les critères
3. Pour chaque entreprise trouvée, le frontend appelle `/api/checkWebsite`
4. Le backend vérifie l'existence d'un site web via :
   - Google Places API (si configuré)
   - Ou méthode de fallback (vérification de domaine probable)
5. Le backend renvoie `{ hasWebsite: true/false, website?: string }`
6. Le frontend met à jour le tableau avec les statuts ✅/❌
7. L'utilisateur peut exporter le tableau en CSV

## Notes

- La fonction serverless a un timeout de 10 secondes (configuré dans `vercel.json`)
- En développement, le proxy Vite redirige `/api/*` vers `localhost:3000`
- Pour la production, utilisez `vercel dev` ou déployez sur Vercel

