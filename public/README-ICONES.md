# Génération des icônes PWA

Pour créer les icônes PNG nécessaires à la PWA, vous pouvez :

1. **Utiliser un outil en ligne** comme https://realfavicongenerator.net/ ou https://www.pwabuilder.com/imageGenerator
2. **Utiliser ImageMagick** (si installé) :
   ```bash
   convert pwa-icon.svg -resize 192x192 pwa-192x192.png
   convert pwa-icon.svg -resize 512x512 pwa-512x512.png
   ```
3. **Utiliser un éditeur d'images** pour créer des icônes 192x192 et 512x512 pixels

Les icônes doivent être en format PNG avec fond transparent ou avec le fond #0f172a (couleur du thème).

