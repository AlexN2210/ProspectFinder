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
      // Fallback: recherche par domaines probables
      const domains = generatePossibleDomains(name, city);
      for (const domain of domains) {
        const exists = await checkWebsiteExistence(domain);
        if (exists) {
          return res.status(200).json({
            hasWebsite: true,
            website: `https://${domain}`
          });
        }
      }
      
      return res.status(200).json({
        hasWebsite: false
      });
    }

    // Méthode 1: Utiliser Google Places API
    const searchQuery = address 
      ? `${name}, ${address}, ${city}`
      : `${name}, ${city}`;

    try {
      const placesResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`
      );

      if (placesResponse.ok) {
        const placesData = await placesResponse.json();

        if (placesData.status === 'OK' && placesData.results && placesData.results.length > 0) {
          // Essayer tous les résultats, pas seulement le premier
          for (const place of placesData.results.slice(0, 3)) {
            if (place.place_id) {
              try {
                const detailsResponse = await fetch(
                  `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,name&key=${apiKey}`
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
        }
      }
    } catch (placesError) {
      console.warn('Google Places API error:', placesError);
    }

    // Méthode 2: Recherche directe par domaines probables
    const domains = generatePossibleDomains(name, city);
    for (const domain of domains) {
      const exists = await checkWebsiteExistence(domain);
      if (exists) {
        return res.status(200).json({
          hasWebsite: true,
          website: `https://${domain}`
        });
      }
    }

    // Méthode 3: Recherche web via DuckDuckGo (sans API key nécessaire)
    try {
      const webSearchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${name} ${city} site officiel`)}`;
      const searchResponse = await fetch(webSearchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (searchResponse.ok) {
        const html = await searchResponse.text();
        // Chercher des URLs dans les résultats
        const urlRegex = /https?:\/\/(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)/g;
        const urls = html.match(urlRegex);
        
        if (urls) {
          // Filtrer les URLs qui correspondent au nom de l'entreprise
          const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const url of urls.slice(0, 10)) {
            const domain = url.replace(/^https?:\/\/(?:www\.)?/, '').split('/')[0];
            const cleanDomain = domain.replace(/[^a-z0-9]/g, '');
            
            // Vérifier si le domaine contient le nom de l'entreprise
            if (cleanDomain.includes(cleanName) || cleanName.includes(cleanDomain.substring(0, 10))) {
              const exists = await checkWebsiteExistence(domain);
              if (exists) {
                return res.status(200).json({
                  hasWebsite: true,
                  website: url.split(' ')[0] // Prendre juste l'URL sans espaces
                });
              }
            }
          }
        }
      }
    } catch (webSearchError) {
      console.warn('Web search error:', webSearchError);
    }

    // Si aucun site web trouvé
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
 * Génère plusieurs domaines probables à partir du nom de l'entreprise
 */
function generatePossibleDomains(name: string, city?: string): string[] {
  const domains: string[] = [];
  
  // Nettoyer le nom
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 30);
  
  // Générer plusieurs variantes
  domains.push(`${cleanName}.fr`);
  domains.push(`${cleanName}.com`);
  domains.push(`www.${cleanName}.fr`);
  domains.push(`www.${cleanName}.com`);
  
  // Si le nom contient plusieurs mots, essayer sans espaces et avec tirets
  const words = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);
  if (words.length > 1) {
    const withDash = words.join('-');
    const withoutSpace = words.join('');
    domains.push(`${withDash}.fr`);
    domains.push(`${withDash}.com`);
    domains.push(`${withoutSpace}.fr`);
    domains.push(`${withoutSpace}.com`);
  }
  
  // Si on a la ville, essayer avec
  if (city) {
    const cleanCity = city.toLowerCase().replace(/[^a-z0-9]/g, '');
    domains.push(`${cleanName}-${cleanCity}.fr`);
    domains.push(`${cleanName}-${cleanCity}.com`);
  }
  
  return domains;
}

/**
 * Vérifie si un site web existe (version simple sans API)
 */
async function checkWebsiteExistence(domain: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Augmenter le timeout
    
    // Essayer d'abord avec HEAD, puis GET si HEAD échoue
    let response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      redirect: 'follow'
    });
    
    clearTimeout(timeoutId);
    
    // Si HEAD fonctionne, c'est bon
    if (response.ok || response.status === 301 || response.status === 302) {
      return true;
    }
    
    // Si HEAD échoue, essayer GET (certains serveurs bloquent HEAD)
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
    
    response = await fetch(`https://${domain}`, {
      method: 'GET',
      signal: controller2.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      redirect: 'follow'
    });
    
    clearTimeout(timeoutId2);
    return response.ok || response.status === 301 || response.status === 302;
  } catch {
    // Si HTTPS échoue, essayer HTTP
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`http://${domain}`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      return response.ok || response.status === 301 || response.status === 302;
    } catch {
      return false;
    }
  }
}

