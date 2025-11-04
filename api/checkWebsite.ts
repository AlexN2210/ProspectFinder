import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RequestBody {
  name: string;
  city: string;
  address?: string;
}

interface ResponseData {
  hasWebsite: boolean;
  website?: string;
  error?: string;
}

/**
 * Fonction serverless pour vérifier l'existence d'un site web
 * Utilise Google Places API (ou une alternative)
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse<ResponseData>
) {
  // Vérifier que la méthode est POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      hasWebsite: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { name, city, address } = req.body as RequestBody;

    if (!name || !city) {
      return res.status(400).json({ 
        hasWebsite: false, 
        error: 'Name and city are required' 
      });
    }

    // Vérifier si GOOGLE_PLACES_API_KEY est configuré
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      // Fallback: recherche simple par nom de domaine probable
      const domain = generateDomainFromName(name);
      const hasWebsite = await checkWebsiteExistence(domain);
      
      return res.status(200).json({
        hasWebsite,
        website: hasWebsite ? `https://${domain}` : undefined
      });
    }

    // Utiliser Google Places API
    const searchQuery = address 
      ? `${name}, ${address}, ${city}`
      : `${name}, ${city}`;

    const placesResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`
    );

    if (!placesResponse.ok) {
      // Si erreur API, utiliser le fallback
      console.warn('Google Places API error, using fallback');
      const domain = generateDomainFromName(name);
      const hasWebsite = await checkWebsiteExistence(domain);
      
      return res.status(200).json({
        hasWebsite,
        website: hasWebsite ? `https://${domain}` : undefined
      });
    }

    const placesData = await placesResponse.json();

    // Vérifier si l'API retourne une erreur
    if (placesData.status && placesData.status !== 'OK') {
      console.warn('Google Places API returned error:', placesData.status);
      // Utiliser le fallback
      const domain = generateDomainFromName(name);
      const hasWebsite = await checkWebsiteExistence(domain);
      
      return res.status(200).json({
        hasWebsite,
        website: hasWebsite ? `https://${domain}` : undefined
      });
    }

    if (placesData.results && placesData.results.length > 0) {
      const place = placesData.results[0];
      
      // Vérifier si le place_id existe pour obtenir plus de détails
      if (place.place_id) {
        try {
          const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website&key=${apiKey}`
          );

          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            
            if (detailsData.result && detailsData.result.website) {
              return res.status(200).json({
                hasWebsite: true,
                website: detailsData.result.website
              });
            }
          }
        } catch (detailsError) {
          console.warn('Error fetching place details:', detailsError);
        }
      }
    }

    // Si aucun site web trouvé via Google Places
    return res.status(200).json({
      hasWebsite: false
    });

  } catch (error) {
    console.error('Error checking website:', error);
    
    // En cas d'erreur, retourner false par défaut
    return res.status(200).json({
      hasWebsite: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Génère un domaine probable à partir du nom de l'entreprise
 */
function generateDomainFromName(name: string): string {
  // Nettoie le nom et génère un domaine probable
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 20);
  
  return `${cleanName}.fr`;
}

/**
 * Vérifie si un site web existe (version simple sans API)
 */
async function checkWebsiteExistence(domain: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 301 || response.status === 302;
  } catch {
    return false;
  }
}

