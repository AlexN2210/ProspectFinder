import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RequestBody {
  city: string;
  apeCodeOrName?: string;
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
    const { city, apeCodeOrName } = req.body as RequestBody;

    if (!city) {
      return res.status(400).json({ 
        companies: [],
        error: 'City is required' 
      });
    }

    // Vérifier si on a une clé API Sirene
    const sireneApiKey = process.env.SIRENE_API_KEY;
    
    if (!sireneApiKey) {
      // Fallback: utiliser l'API Sirene publique (gratuite mais limitée)
      return await searchWithPublicSireneAPI(city, apeCodeOrName, res);
    }

    // Utiliser l'API Sirene avec clé (si disponible)
    return await searchWithSireneAPI(city, apeCodeOrName, sireneApiKey, res);

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
  city: string,
  apeCodeOrName: string | undefined,
  res: VercelResponse<ResponseData>
) {
  try {
    // Construire la requête de recherche
    // L'API Recherche Entreprises recherche par texte libre
    let query = city;
    
    if (apeCodeOrName) {
      // Si c'est un code APE (format: 4 chiffres + 1 lettre)
      if (/^\d{4}[A-Z]$/.test(apeCodeOrName.toUpperCase())) {
        query = `${city} ${apeCodeOrName.toUpperCase()}`;
      } else {
        // Sinon, recherche par nom
        query = `${apeCodeOrName} ${city}`;
      }
    }

    console.log('Searching with query:', query);

    // API Recherche Entreprises (publique et gratuite)
    // per_page doit être entre 1 et 25 (par défaut 10)
    const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&per_page=25`;
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
    console.log('API Response data:', JSON.stringify(data, null, 2));
    console.log('Results count:', data.results?.length || 0);

    // Filtrer les résultats pour ne garder que ceux de la ville demandée
    let filteredResults = (data.results || []);
    
    // Filtrer par ville si possible
    if (filteredResults.length > 0) {
      filteredResults = filteredResults.filter((result: any) => {
        const siege = result.siege || {};
        const ville = (siege.ville || '').toLowerCase();
        const cityLower = city.toLowerCase();
        return ville.includes(cityLower) || cityLower.includes(ville);
      });
      console.log('Filtered results count:', filteredResults.length);
    }

    // Transformer les résultats en format Company
    const companies: Company[] = filteredResults.map((result: any, index: number) => {
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

    console.log(`Found ${companies.length} companies after filtering`);
    return res.status(200).json({ companies });

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
  city: string,
  apeCodeOrName: string | undefined,
  apiKey: string,
  res: VercelResponse<ResponseData>
) {
  try {
    // Construire la requête
    let query = `codeCommuneEtablissement:${encodeURIComponent(city)}`;
    
    if (apeCodeOrName) {
      if (/^\d{4}[A-Z]$/.test(apeCodeOrName.toUpperCase())) {
        query += ` AND activitePrincipaleEtablissement:${apeCodeOrName.toUpperCase()}`;
      } else {
        query += ` AND denominationUniteLegale:"${apeCodeOrName}"`;
      }
    }

    const response = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${query}&per_page=25`,
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

    const companies: Company[] = (data.results || []).map((etab: any, index: number) => ({
      id: etab.siret || `etab-${index}`,
      name: etab.nom || etab.denomination || 'Entreprise',
      address: etab.siege?.adresse || '',
      city: etab.siege?.ville || city,
      postalCode: etab.siege?.code_postal || '',
      phone: etab.telephone || undefined,
      email: etab.email || undefined,
      apeCode: etab.activite_principale || '',
      latitude: etab.latitude ? parseFloat(etab.latitude) : undefined,
      longitude: etab.longitude ? parseFloat(etab.longitude) : undefined,
    }));

    return res.status(200).json({ companies });

  } catch (error) {
    console.error('Error with Sirene API:', error);
    return res.status(200).json({ companies: [] });
  }
}

