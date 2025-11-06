import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RequestBody {
  website: string;
  companyName?: string;
}

interface WebsiteAnalysis {
  exists: boolean;
  quality: 'excellent' | 'good' | 'poor' | 'none';
  score: number; // 0-100
  issues: string[];
  hasMobileVersion: boolean;
  hasModernDesign: boolean;
  loadTime?: number;
  error?: string;
}

/**
 * Analyse la qualité d'un site web
 * Vérifie l'existence, le design, la responsivité, etc.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse<WebsiteAnalysis>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      exists: false,
      quality: 'none',
      score: 0,
      issues: [],
      hasMobileVersion: false,
      hasModernDesign: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { website, companyName } = req.body as RequestBody;

    if (!website) {
      return res.status(400).json({
        exists: false,
        quality: 'none',
        score: 0,
        issues: ['URL du site web manquante'],
        hasMobileVersion: false,
        hasModernDesign: false,
        error: 'Website URL is required'
      });
    }

    // Normaliser l'URL
    let url = website;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const analysis = await analyzeWebsiteQuality(url, companyName);
    return res.status(200).json(analysis);

  } catch (error) {
    console.error('Error analyzing website:', error);
    return res.status(200).json({
      exists: false,
      quality: 'none',
      score: 0,
      issues: ['Erreur lors de l\'analyse'],
      hasMobileVersion: false,
      hasModernDesign: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Analyse la qualité d'un site web
 */
async function analyzeWebsiteQuality(url: string, companyName?: string): Promise<WebsiteAnalysis> {
  const issues: string[] = [];
  let score = 100;
  let hasMobileVersion = false;
  let hasModernDesign = false;
  let loadTime: number | undefined;
  let exists = false;

  try {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes max

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    clearTimeout(timeoutId);
    loadTime = Date.now() - startTime;

    if (!response.ok && response.status !== 301 && response.status !== 302) {
      return {
        exists: false,
        quality: 'none',
        score: 0,
        issues: [`Site inaccessible (code ${response.status})`],
        hasMobileVersion: false,
        hasModernDesign: false,
        loadTime
      };
    }

    exists = true;
    const html = await response.text();

    // Vérifier la présence de meta viewport (indicateur de design responsive)
    const hasViewport = /<meta[^>]*name=["']viewport["'][^>]*>/i.test(html);
    hasMobileVersion = hasViewport;
    
    if (!hasViewport) {
      issues.push('Pas de meta viewport (site probablement non responsive)');
      score -= 20;
    }

    // Vérifier l'utilisation de frameworks modernes ou de CSS moderne
    const hasModernCSS = /flex|grid|transform|transition/i.test(html) || 
                         /bootstrap|tailwind|material|ant-design/i.test(html);
    hasModernDesign = hasModernCSS;
    
    if (!hasModernCSS) {
      issues.push('Design potentiellement obsolète (pas de CSS moderne détecté)');
      score -= 15;
    }

    // Vérifier la présence de JavaScript moderne
    const hasModernJS = /react|vue|angular|next\.js|nuxt/i.test(html) ||
                        /\.jsx?|\.tsx?/i.test(html) ||
                        /type=["']module["']/i.test(html);
    
    if (!hasModernJS) {
      issues.push('Pas de framework JavaScript moderne détecté');
      score -= 10;
    }

    // Vérifier les performances (taille de la page)
    const htmlSize = new Blob([html]).size;
    if (htmlSize > 500000) { // Plus de 500KB
      issues.push('Page très lourde (peut affecter les performances)');
      score -= 10;
    }

    // Vérifier le temps de chargement
    if (loadTime > 3000) {
      issues.push(`Temps de chargement lent (${loadTime}ms)`);
      score -= 15;
    } else if (loadTime > 2000) {
      issues.push(`Temps de chargement modéré (${loadTime}ms)`);
      score -= 10;
    }

    // Vérifier la présence d'HTTPS
    if (!url.startsWith('https://')) {
      issues.push('Site non sécurisé (pas de HTTPS)');
      score -= 20;
    }

    // Vérifier la présence d'informations de contact
    const hasContactInfo = /contact|email|@|téléphone|phone/i.test(html);
    if (!hasContactInfo) {
      issues.push('Informations de contact difficiles à trouver');
      score -= 5;
    }

    // Déterminer la qualité globale
    let quality: 'excellent' | 'good' | 'poor' | 'none';
    if (score >= 80) {
      quality = 'excellent';
    } else if (score >= 60) {
      quality = 'good';
    } else if (score >= 40) {
      quality = 'poor';
    } else {
      quality = 'poor';
    }

    // Si le site n'existe pas vraiment, mettre à jour
    if (issues.length > 0 && issues[0].includes('inaccessible')) {
      exists = false;
      quality = 'none';
      score = 0;
    }

    return {
      exists,
      quality,
      score: Math.max(0, Math.min(100, score)),
      issues,
      hasMobileVersion,
      hasModernDesign,
      loadTime
    };

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      issues.push('Timeout lors du chargement du site');
      score = 0;
    } else {
      issues.push('Erreur lors de l\'analyse du site');
      score = 0;
    }
    
    return {
      exists: false,
      quality: 'none',
      score: 0,
      issues,
      hasMobileVersion: false,
      hasModernDesign: false,
      loadTime
    };
  }
}

