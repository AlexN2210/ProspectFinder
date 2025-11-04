# Configuration de la clé Google Places API

## Clé API fournie
```
AIzaSyCa3HwCzuRqgeXnD7EieVk7QeBHBeWARlA
```

## Configuration locale (.env.local)

Créez un fichier `.env.local` à la racine du dossier `project/` avec :

```
GOOGLE_PLACES_API_KEY=AIzaSyCa3HwCzuRqgeXnD7EieVk7QeBHBeWARlA
```

## Configuration Vercel (pour la production)

### Via l'interface Vercel :
1. Allez sur votre projet dans Vercel
2. Naviguez vers **Settings** > **Environment Variables**
3. Ajoutez une nouvelle variable :
   - **Name**: `GOOGLE_PLACES_API_KEY`
   - **Value**: `AIzaSyCa3HwCzuRqgeXnD7EieVk7QeBHBeWARlA`
   - **Environment**: Production, Preview, Development (selon vos besoins)
4. Cliquez sur **Save**
5. Redéployez votre application pour que les changements prennent effet

### Via la CLI Vercel :
```bash
vercel env add GOOGLE_PLACES_API_KEY
# Entrez la clé: AIzaSyCa3HwCzuRqgeXnD7EieVk7QeBHBeWARlA
```

## Vérification

Une fois la clé configurée, l'API `/api/checkWebsite` utilisera Google Places API pour vérifier l'existence des sites web des entreprises.

Sans cette clé, l'API utilisera une méthode de fallback qui vérifie l'existence d'un domaine probable.

## Sécurité

⚠️ **Important** : Ne commitez jamais votre clé API dans le dépôt Git. Le fichier `.env.local` est déjà dans `.gitignore` et ne sera pas versionné.

