import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RequestBody {
  city?: string;
  departmentCode?: string;
  apeCodeOrName?: string;
  page?: number;
  limit?: number;
}

interface Company {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone?: string;
  email?: string;
  apeCode: string;
  latitude?: number;
  longitude?: number;
}

interface ResponseData {
  companies: Company[];
  totalPages?: number;
  currentPage?: number;
  hasMore?: boolean;
  error?: string;
}

/**
 * Fonction serverless pour rechercher des entreprises réelles
 * Utilise l'API Sirene (base de données officielle française)
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      companies: [],
      error: 'Method not allowed' 
    });
  }

  try {
    const { city, departmentCode, apeCodeOrName, page = 1, limit } = req.body as RequestBody;

    if (!city && !departmentCode) {
      return res.status(400).json({ 
        companies: [],
        error: 'City or departmentCode is required' 
      });
    }

    // Vérifier si on a une clé API Sirene
    const sireneApiKey = process.env.SIRENE_API_KEY;
    
    if (!sireneApiKey) {
      // Fallback: utiliser l'API Sirene publique (gratuite mais limitée)
      return await searchWithPublicSireneAPI(city, departmentCode, apeCodeOrName, page, limit, res);
    }

    // Utiliser l'API Sirene avec clé (si disponible)
    return await searchWithSireneAPI(city, departmentCode, apeCodeOrName, page, limit, sireneApiKey, res);

  } catch (error) {
    console.error('Error searching companies:', error);
    return res.status(500).json({
      companies: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Recherche avec l'API Sirene publique (gratuite)
 * Utilise l'API Recherche Entreprises du gouvernement français
 */
async function searchWithPublicSireneAPI(
  city: string | undefined,
  departmentCode: string | undefined,
  apeCodeOrName: string | undefined,
  page: number,
  limit: number | undefined,
  res: VercelResponse<ResponseData>
) {
  try {
    // Construire la requête de recherche
    // L'API Recherche Entreprises recherche par texte libre
    let query = '';
    
    // Si on a une ville ET un département, on cherche par ville + code APE (plus efficace)
    // Sinon, si on a seulement un département, on cherche par code APE uniquement
    if (city && city.trim()) {
      // Recherche par ville (priorité si ville fournie)
      if (apeCodeOrName) {
        if (/^\d{4}[A-Z]$/.test(apeCodeOrName.toUpperCase())) {
          query = `${city} ${apeCodeOrName.toUpperCase()}`;
        } else {
          query = `${apeCodeOrName} ${city}`;
        }
      } else {
        query = city;
      }
    } else if (departmentCode) {
      // Si on a seulement un département (sans ville), chercher par code APE uniquement
      const normalizedDeptCode = departmentCode.padStart(2, '0');
      
      if (apeCodeOrName) {
        // Si c'est un code APE (format: 4 chiffres + 1 lettre)
        if (/^\d{4}[A-Z]$/.test(apeCodeOrName.toUpperCase())) {
          // Rechercher uniquement par code APE (on filtrera par département après)
          query = apeCodeOrName.toUpperCase();
        } else {
          // Recherche par nom du secteur uniquement
          query = apeCodeOrName;
        }
      } else {
        // Si pas de code APE mais un département, on ne peut pas faire une recherche efficace
        // On cherchera par code postal mais ça ne fonctionnera pas bien
        query = `${normalizedDeptCode}000`;
      }
    } else if (apeCodeOrName) {
      // Si c'est un code APE (format: 4 chiffres + 1 lettre)
      if (/^\d{4}[A-Z]$/.test(apeCodeOrName.toUpperCase())) {
        // Si on a une ville, l'inclure, sinon chercher uniquement par code APE
        query = city ? `${city} ${apeCodeOrName.toUpperCase()}` : apeCodeOrName.toUpperCase();
      } else {
        // Sinon, recherche par nom
        query = city ? `${apeCodeOrName} ${city}` : apeCodeOrName;
      }
    } else if (city) {
      // Si pas de code APE mais une ville
      query = city;
    } else {
      // Si ni ville ni code APE ni département, retourner vide
      return res.status(400).json({
        companies: [],
        error: 'City, departmentCode or apeCodeOrName is required'
      });
    }

    console.log(`Searching with query: ${query}, page: ${page}, departmentCode: ${departmentCode}`);

    // API Recherche Entreprises (publique et gratuite)
    // per_page doit être entre 1 et 25 (par défaut 10)
    const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&per_page=25&page=${page}`;
    console.log('API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Sirene API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Page ${page} - Results count:`, data.results?.length || 0);

    // Filtrer les résultats
    let filteredResults = (data.results || []);
    
    // Filtrer par département si un code département a été spécifié
    if (departmentCode && filteredResults.length > 0) {
      const normalizedDeptCode = departmentCode.padStart(2, '0');
      filteredResults = filteredResults.filter((result: any) => {
        const siege = result.siege || {};
        const postalCode = (siege.code_postal || siege.codePostal || '').trim();
        if (!postalCode) return false;
        
        // Vérifier si le code postal commence par le code du département
        // Support pour les codes postaux à 2 chiffres (02) et à 3 chiffres (020)
        const postalCodeStart = postalCode.substring(0, 2);
        const postalCodeStart3 = postalCode.substring(0, 3);
        return postalCodeStart === normalizedDeptCode || 
               postalCodeStart3 === normalizedDeptCode + '0' ||
               postalCode.startsWith(normalizedDeptCode);
      });
      console.log(`Filtered by department ${normalizedDeptCode}, results count: ${filteredResults.length} (from ${data.results?.length || 0} total)`);
    }
    
    // Filtrer aussi par ville si une ville a été spécifiée (en plus du département)
    if (city && city.trim() && filteredResults.length > 0) {
      const beforeCityFilter = filteredResults.length;
      filteredResults = filteredResults.filter((result: any) => {
        const siege = result.siege || {};
        const ville = (siege.ville || '').toLowerCase();
        const cityLower = city.toLowerCase();
        return ville.includes(cityLower) || cityLower.includes(ville);
      });
      console.log(`Filtered by city ${city}, results count: ${filteredResults.length} (from ${beforeCityFilter} total)`);
    }
    
    if (!departmentCode && !city) {
      console.log('No filter applied, using all results');
    }

    // Transformer les résultats en format Company
    let companies: Company[] = filteredResults.map((result: any, index: number) => {
      const siege = result.siege || {};
      const activite = result.activite_principale || result.activitePrincipale || '';
      
      // Construire l'adresse complète
      let address = '';
      if (siege.adresse) {
        address = siege.adresse;
      } else if (siege.numero_voie || siege.libelle_voie) {
        address = `${siege.numero_voie || ''} ${siege.type_voie || ''} ${siege.libelle_voie || ''}`.trim();
      } else if (siege.adresse_complete) {
        address = siege.adresse_complete;
      }

      return {
        id: result.siret || result.siren || `etab-${index}`,
        name: result.nom_complet || result.nom || result.denomination || result.nomComplet || 'Entreprise',
        address: address,
        city: siege.ville || city,
        postalCode: siege.code_postal || siege.codePostal || '',
        phone: result.telephone || undefined,
        email: result.email || undefined,
        apeCode: activite,
        latitude: siege.latitude ? parseFloat(String(siege.latitude)) : undefined,
        longitude: siege.longitude ? parseFloat(String(siege.longitude)) : undefined,
      };
    });

    // Limiter le nombre de résultats si un limit est spécifié
    if (limit && limit > 0) {
      companies = companies.slice(0, limit);
    }

    // Vérifier s'il y a une page suivante (si on a 25 résultats et pas de limit, il y a probablement une page suivante)
    const hasMore = !limit && filteredResults.length === 25;

    console.log(`Found ${companies.length} companies on page ${page}, hasMore: ${hasMore}`);
    return res.status(200).json({ 
      companies,
      currentPage: page,
      hasMore
    });

  } catch (error) {
    console.error('Error with public Sirene API:', error);
    // En cas d'erreur, retourner un tableau vide avec le message d'erreur
    return res.status(200).json({ 
      companies: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Recherche avec l'API Sirene avec clé (version premium)
 */
async function searchWithSireneAPI(
  city: string | undefined,
  departmentCode: string | undefined,
  apeCodeOrName: string | undefined,
  page: number,
  limit: number | undefined,
  apiKey: string,
  res: VercelResponse<ResponseData>
) {
  try {
    // Construire la requête
    let query = '';
    
    if (departmentCode) {
      const normalizedDeptCode = departmentCode.padStart(2, '0');
      // Rechercher par code postal du département
      query = `codePostalEtablissement:${normalizedDeptCode}*`;
    } else if (city) {
      query = `codeCommuneEtablissement:${encodeURIComponent(city)}`;
    }
    
    if (apeCodeOrName) {
      if (/^\d{4}[A-Z]$/.test(apeCodeOrName.toUpperCase())) {
        query += query ? ` AND activitePrincipaleEtablissement:${apeCodeOrName.toUpperCase()}` : `activitePrincipaleEtablissement:${apeCodeOrName.toUpperCase()}`;
      } else {
        query += query ? ` AND denominationUniteLegale:"${apeCodeOrName}"` : `denominationUniteLegale:"${apeCodeOrName}"`;
      }
    }

    const response = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&per_page=25&page=${page}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error('Sirene API error');
    }

    const data = await response.json();

    let companies: Company[] = (data.results || []).map((etab: any, index: number) => ({
      id: etab.siret || `etab-${index}`,
      name: etab.nom || etab.denomination || 'Entreprise',
      address: etab.siege?.adresse || '',
      city: etab.siege?.ville || city,
      postalCode: etab.siege?.code_postal || '',
      phone: etab.telephone || undefined,
      email: etab.email || undefined,
      apeCode: etab.activite_principale || '',
      latitude: etab.latitude ? parseFloat(String(etab.latitude)) : undefined,
      longitude: etab.longitude ? parseFloat(String(etab.longitude)) : undefined,
    }));

    // Limiter le nombre de résultats si un limit est spécifié
    if (limit && limit > 0) {
      companies = companies.slice(0, limit);
    }

    // Vérifier s'il y a une page suivante
    const hasMore = !limit && companies.length === 25;

    return res.status(200).json({ 
      companies,
      currentPage: page,
      hasMore
    });

  } catch (error) {
    console.error('Error with Sirene API:', error);
    return res.status(200).json({ companies: [] });
  }
}

