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
  res: VercelResponse
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

    // Vérifier si on a une clé API Sirene v3.11 (INSEE)
    const sireneApiKey = process.env.SIRENE_API_KEY || process.env.INSEE_API_KEY;
    
    if (!sireneApiKey) {
      // Fallback: utiliser l'API Sirene publique (gratuite mais limitée)
      return await searchWithPublicSireneAPI(city, departmentCode, apeCodeOrName, page, limit, res);
    }

    // Utiliser l'API Sirene v3.11 avec clé (si disponible)
    return await searchWithSireneV3API(city, departmentCode, apeCodeOrName, page, limit, sireneApiKey, res);

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
  res: VercelResponse
) {
  try {
    // Construire la requête de recherche
    let query = '';
    
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
          // Rechercher par code APE uniquement (on filtrera par département après)
          query = apeCodeOrName.toUpperCase();
        } else if (/^\d{4}$/.test(apeCodeOrName)) {
          // Si c'est un code APE sans la lettre (4 chiffres), chercher par ce code
          query = apeCodeOrName;
        } else {
          // Recherche par nom du secteur
          query = apeCodeOrName;
        }
      } else {
        // Si pas de code APE, chercher par code postal du département
        query = `${normalizedDeptCode}000`;
      }
    } else if (apeCodeOrName) {
      // Si c'est un code APE (format: 4 chiffres + 1 lettre)
      if (/^\d{4}[A-Z]$/.test(apeCodeOrName.toUpperCase())) {
        query = city ? `${city} ${apeCodeOrName.toUpperCase()}` : apeCodeOrName.toUpperCase();
      } else {
        query = city ? `${apeCodeOrName} ${city}` : apeCodeOrName;
      }
    } else if (city) {
      query = city;
    } else {
      return res.status(400).json({
        companies: [],
        error: 'City, departmentCode or apeCodeOrName is required'
      });
    }

    console.log(`Searching with query: ${query}, page: ${page}, departmentCode: ${departmentCode}`);

    // API Recherche Entreprises (publique et gratuite)
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
      const beforeFilter = filteredResults.length;
      filteredResults = filteredResults.filter((result: any) => {
        const siege = result.siege || {};
        const postalCode = (siege.code_postal || siege.codePostal || '').trim();
        if (!postalCode) {
          // Si pas de code postal, vérifier la ville (certaines villes peuvent être dans le département)
          const ville = (siege.ville || '').toLowerCase();
          // Pour les départements d'outre-mer, on peut être plus permissif
          if (normalizedDeptCode.startsWith('97')) {
            return true; // Garder les résultats sans code postal pour les DOM
          }
          return false;
        }
        
        // Vérifier si le code postal commence par le code du département
        const postalCodeStart = postalCode.substring(0, 2);
        const postalCodeStart3 = postalCode.substring(0, 3);
        return postalCodeStart === normalizedDeptCode || 
               postalCodeStart3 === normalizedDeptCode + '0' ||
               postalCode.startsWith(normalizedDeptCode);
      });
      console.log(`Filtered by department ${normalizedDeptCode}: ${filteredResults.length} results (from ${beforeFilter} total)`);
    }
    
    // Filtrer aussi par ville si une ville a été spécifiée
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
        city: siege.ville || city || '',
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

    // Vérifier s'il y a une page suivante
    const hasMore = !limit && filteredResults.length === 25;

    console.log(`Found ${companies.length} companies on page ${page}, hasMore: ${hasMore}`);
    return res.status(200).json({ 
      companies,
      currentPage: page,
      hasMore
    });

  } catch (error) {
    console.error('Error with public Sirene API:', error);
    return res.status(200).json({ 
      companies: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Recherche avec l'API Sirene v3.11 de l'INSEE (version structurée)
 * Utilise des filtres structurés : code APE, département, code postal, commune
 * Documentation: https://api.insee.fr/api-sirene/3.11
 */
async function searchWithSireneV3API(
  city: string | undefined,
  departmentCode: string | undefined,
  apeCodeOrName: string | undefined,
  page: number,
  limit: number | undefined,
  apiKey: string,
  res: VercelResponse
) {
  try {
    // Construire la requête avec des filtres structurés pour l'API Sirene v3
    const filters: string[] = [];
    
    // Filtre par code APE (activité principale)
    if (apeCodeOrName && /^\d{4}[A-Z]$/.test(apeCodeOrName.toUpperCase())) {
      filters.push(`activitePrincipaleUniteLegale:${apeCodeOrName.toUpperCase()}`);
    }
    
    // Filtre par département (code postal commence par le code département)
    if (departmentCode) {
      const normalizedDeptCode = departmentCode.padStart(2, '0');
      // Rechercher par code postal qui commence par le code département
      filters.push(`codePostalEtablissement:${normalizedDeptCode}*`);
    }
    
    // Filtre par code postal spécifique (si on a une ville avec code postal connu)
    // Note: Pour l'instant, on utilise le département, mais on pourrait améliorer avec des codes postaux spécifiques
    
    // Construire la requête finale
    const query = filters.length > 0 ? filters.join(' AND ') : '*';
    
    // Calculer le nombre de résultats par page (max 100 pour Sirene v3.11)
    const perPage = limit && limit < 100 ? limit : 25;
    const start = (page - 1) * perPage;
    
    // URL de l'API Sirene v3.11
    // Endpoint: /siret pour rechercher des établissements
    const apiUrl = `https://api.insee.fr/api-sirene/3.11/siret?q=${encodeURIComponent(query)}&nombre=${perPage}&debut=${start}`;
    
    console.log('Sirene v3.11 API URL:', apiUrl);
    console.log('Query:', query);

    const response = await fetch(apiUrl, {
      headers: {
        'X-INSEE-Api-Key-Integration': apiKey,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sirene v3.11 API error:', response.status, errorText);
      // En cas d'erreur, fallback sur l'API publique
      return await searchWithPublicSireneAPI(city, departmentCode, apeCodeOrName, page, limit, res);
    }

    const data = await response.json();

    // Transformer les résultats de l'API Sirene v3
    let companies: Company[] = [];
    
    if (data.etablissements && Array.isArray(data.etablissements)) {
      companies = data.etablissements.map((etab: any) => {
        const uniteLegale = etab.uniteLegale || {};
        const adresseEtablissement = etab.adresseEtablissement || {};
        const activitePrincipale = uniteLegale.activitePrincipaleUniteLegale || 
                                   etab.periodesEtablissement?.[0]?.activitePrincipaleEtablissement || '';
        
        // Construire l'adresse complète
        let address = '';
        if (adresseEtablissement.numeroVoieEtablissement || adresseEtablissement.typeVoieEtablissement || adresseEtablissement.libelleVoieEtablissement) {
          address = `${adresseEtablissement.numeroVoieEtablissement || ''} ${adresseEtablissement.typeVoieEtablissement || ''} ${adresseEtablissement.libelleVoieEtablissement || ''}`.trim();
        }
        
        return {
          id: etab.siret || '',
          name: uniteLegale.denominationUniteLegale || (uniteLegale.prenom1UniteLegale && uniteLegale.nomUniteLegale ? `${uniteLegale.prenom1UniteLegale} ${uniteLegale.nomUniteLegale}` : 'Entreprise') || 'Entreprise',
          address: address,
          city: adresseEtablissement.libelleCommuneEtablissement || city || '',
          postalCode: adresseEtablissement.codePostalEtablissement || '',
          phone: undefined, // L'API Sirene v3 ne fournit pas le téléphone
          email: undefined, // L'API Sirene v3 ne fournit pas l'email
          apeCode: activitePrincipale,
          latitude: adresseEtablissement.latitude ? parseFloat(String(adresseEtablissement.latitude)) : undefined,
          longitude: adresseEtablissement.longitude ? parseFloat(String(adresseEtablissement.longitude)) : undefined,
        };
      });
    }

    // Limiter le nombre de résultats si un limit est spécifié
    if (limit && limit > 0) {
      companies = companies.slice(0, limit);
    }

    // Vérifier s'il y a une page suivante
    const total = data.header?.total || 0;
    const hasMore = total > start + companies.length;

    console.log(`Sirene v3.11: Found ${companies.length} companies (total: ${total})`);

    return res.status(200).json({ 
      companies,
      currentPage: page,
      hasMore
    });

  } catch (error) {
    console.error('Error with Sirene v3.11 API:', error);
    // En cas d'erreur, fallback sur l'API publique
    return await searchWithPublicSireneAPI(city, departmentCode, apeCodeOrName, page, limit, res);
  }
}