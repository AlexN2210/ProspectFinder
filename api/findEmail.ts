import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RequestBody {
  companyName: string;
  website?: string;
  city?: string;
  address?: string;
}

interface EmailResult {
  email?: string;
  found: boolean;
  source?: 'website' | 'guessed' | 'api';
  error?: string;
}

/**
 * Recherche l'adresse email d'une entreprise
 * Essaie plusieurs méthodes : scraping du site, génération probable, APIs tierces
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse<EmailResult>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      found: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { companyName, website, city, address } = req.body as RequestBody;

    if (!companyName) {
      return res.status(400).json({
        found: false,
        error: 'Company name is required'
      });
    }

    // Méthode 1: Scraper le site web si disponible
    if (website) {
      const emailFromWebsite = await findEmailOnWebsite(website);
      if (emailFromWebsite) {
        return res.status(200).json({
          email: emailFromWebsite,
          found: true,
          source: 'website'
        });
      }
    }

    // Méthode 2: Générer des emails probables
    const guessedEmails = generateProbableEmails(companyName, city);
    for (const email of guessedEmails) {
      // Vérifier si l'email est valide (format)
      if (isValidEmailFormat(email)) {
        // On retourne le premier email probable (on ne peut pas vraiment vérifier sans envoyer un email)
        return res.status(200).json({
          email: email,
          found: true,
          source: 'guessed'
        });
      }
    }

    // Aucun email trouvé
    return res.status(200).json({
      found: false
    });

  } catch (error) {
    console.error('Error finding email:', error);
    return res.status(200).json({
      found: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Recherche un email sur le site web de l'entreprise
 */
async function findEmailOnWebsite(website: string): Promise<string | null> {
  try {
    let url = website;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Rechercher des emails dans le HTML
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = html.match(emailRegex);

    if (emails && emails.length > 0) {
      // Filtrer les emails de service (noreply, no-reply, etc.)
      const validEmails = emails.filter(email => 
        !email.includes('noreply') && 
        !email.includes('no-reply') &&
        !email.includes('example.com') &&
        !email.includes('test.com') &&
        !email.includes('placeholder')
      );

      if (validEmails.length > 0) {
        // Retourner le premier email valide
        return validEmails[0].toLowerCase();
      }
    }

    // Chercher dans les liens mailto:
    const mailtoRegex = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    const mailtoMatches = html.match(mailtoRegex);
    
    if (mailtoMatches && mailtoMatches.length > 0) {
      const email = mailtoMatches[0].replace('mailto:', '').toLowerCase();
      if (!email.includes('noreply') && !email.includes('no-reply')) {
        return email;
      }
    }

    return null;

  } catch (error) {
    console.error('Error scraping website for email:', error);
    return null;
  }
}

/**
 * Génère des emails probables basés sur le nom de l'entreprise
 */
function generateProbableEmails(companyName: string, city?: string): string[] {
  const emails: string[] = [];

  // Nettoyer le nom de l'entreprise
  const cleanName = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 30);

  // Générer des variantes communes
  emails.push(`contact@${cleanName}.fr`);
  emails.push(`info@${cleanName}.fr`);
  emails.push(`contact@${cleanName}.com`);
  emails.push(`info@${cleanName}.com`);

  // Si on a le nom de la ville, essayer avec
  if (city) {
    const cleanCity = city.toLowerCase().replace(/[^a-z0-9]/g, '');
    emails.push(`contact@${cleanName}-${cleanCity}.fr`);
  }

  return emails;
}

/**
 * Vérifie si un email a un format valide
 */
function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

