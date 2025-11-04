# Recherche d'entreprises réelles

## API utilisée

L'application utilise maintenant l'**API Recherche Entreprises** du gouvernement français, qui est :
- ✅ **Publique et gratuite**
- ✅ **Sans limite de requêtes** (dans la limite raisonnable)
- ✅ **Données officielles** (base Sirene)

## Comment ça fonctionne

### 1. Recherche d'entreprises
- L'API `/api/searchCompanies` interroge l'API Recherche Entreprises
- Recherche par **ville** et optionnellement par **code APE** ou **nom d'entreprise**
- Retourne jusqu'à 50 entreprises par recherche

### 2. Vérification des sites web
- Pour chaque entreprise trouvée, l'API `/api/checkWebsite` vérifie l'existence d'un site web
- Utilise **Google Places API** avec votre clé API
- Met à jour le statut ✅/❌ en temps réel

## Utilisation

### Recherche simple
1. Entrez une **ville** (ex: "Paris", "Lyon", "Marseille")
2. Optionnel : ajoutez un **code APE** (ex: "5610A") ou un **nom** (ex: "Restaurant")
3. Cliquez sur "Rechercher"

### Résultats
- Les entreprises s'affichent immédiatement
- Le scan des sites web se fait en arrière-plan avec barre de progression
- Les statuts ✅/❌ sont mis à jour automatiquement

## Exemples de recherche

### Par ville uniquement
- Ville: `Paris` → Trouve toutes les entreprises à Paris

### Par ville + code APE
- Ville: `Lyon`
- Code APE: `5610A` → Trouve les restaurants à Lyon

### Par ville + nom
- Ville: `Marseille`
- Nom: `Boulangerie` → Trouve les boulangeries à Marseille

## Notes techniques

- L'API Recherche Entreprises est accessible sans authentification
- Limite de 50 résultats par recherche
- Les données sont mises à jour quotidiennement
- Le code APE doit être au format `XXXXA` (4 chiffres + 1 lettre)

