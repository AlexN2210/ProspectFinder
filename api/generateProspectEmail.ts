import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RequestBody {
  companyName: string;
  contactName?: string;
  websiteStatus: 'none' | 'poor' | 'good' | 'excellent';
  websiteUrl?: string;
  companyCity?: string;
  companyActivity?: string;
}

interface EmailResult {
  subject: string;
  body: string;
  error?: string;
}

/**
 * Génère un email de prospection personnalisé
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse<EmailResult>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      subject: '',
      body: '',
      error: 'Method not allowed'
    });
  }

  try {
    const { companyName, contactName, websiteStatus, websiteUrl, companyCity, companyActivity } = req.body as RequestBody;

    if (!companyName) {
      return res.status(400).json({
        subject: '',
        body: '',
        error: 'Company name is required'
      });
    }

    const email = generateEmail(companyName, contactName, websiteStatus, websiteUrl, companyCity, companyActivity);
    
    return res.status(200).json(email);

  } catch (error) {
    console.error('Error generating email:', error);
    return res.status(500).json({
      subject: '',
      body: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Génère le contenu de l'email de prospection
 */
function generateEmail(
  companyName: string,
  contactName?: string,
  websiteStatus: 'none' | 'poor' | 'good' | 'excellent' = 'none',
  websiteUrl?: string,
  companyCity?: string,
  companyActivity?: string
): EmailResult {
  // Salutation personnalisée
  const greeting = contactName 
    ? `Bonjour ${contactName},`
    : `Bonjour,`;

  // Construire le sujet
  let subject = '';
  let body = '';

  // Signature personnalisée
  const signature = `Alexis

Développeur Web Freelance

📞 0652173816 • 🌐 www.alexisdevfullstack.com`;

  // Adapter le message selon l'état du site web
  if (websiteStatus === 'none') {
    subject = `Votre présence en ligne : une opportunité pour ${companyName}`;
    body = `${greeting}

Je me permets de vous contacter concernant votre présence digitale. En tant que développeur web freelance spécialisé dans la conception et la refonte de sites web, j'ai remarqué que ${companyName}${companyCity ? ` à ${companyCity}` : ''} n'a pas encore de site web.

Dans un monde où 80% des clients recherchent une entreprise en ligne avant de prendre contact, l'absence de site web peut représenter une perte d'opportunités significative.

Je serais ravi de discuter avec vous de la création d'un site web professionnel adapté à votre activité${companyActivity ? ` de ${companyActivity.toLowerCase()}` : ''}, qui vous permettrait de :
• Augmenter votre visibilité locale${companyCity ? ` à ${companyCity}` : ''}
• Attirer de nouveaux clients
• Présenter vos services de manière professionnelle
• Gagner en crédibilité

Seriez-vous disponible pour un échange de 15 minutes afin de discuter de vos besoins et de voir comment je peux vous accompagner ?

Cordialement,

${signature}`;

  } else if (websiteStatus === 'poor') {
    subject = `Moderniser le site web de ${companyName} : une opportunité de croissance`;
    body = `${greeting}

Je me permets de vous contacter concernant le site web de ${companyName}${websiteUrl ? ` (${websiteUrl})` : ''}${companyCity ? ` à ${companyCity}` : ''}.

En tant que développeur web freelance spécialisé dans la refonte de sites web, j'ai constaté que votre site présente certaines opportunités d'amélioration pour mieux répondre aux attentes de vos clients actuels et futurs.

Une refonte moderne permettrait à ${companyName} de :
• Améliorer l'expérience utilisateur et la navigation
• Optimiser la compatibilité mobile (de plus en plus importante)
• Renforcer votre image de marque et votre professionnalisme
• Améliorer votre référencement et votre visibilité en ligne
• Augmenter vos conversions et vos prises de contact

Je serais ravi de vous proposer un audit gratuit de votre site actuel et de discuter ensemble des améliorations possibles.

Seriez-vous disponible pour un échange de 15 minutes cette semaine ?

Cordialement,

${signature}`;

  } else {
    // Site bon ou excellent - approche différente
    subject = `Optimisation et évolution du site web de ${companyName}`;
    body = `${greeting}

Je me permets de vous contacter concernant le site web de ${companyName}${websiteUrl ? ` (${websiteUrl})` : ''}${companyCity ? ` à ${companyCity}` : ''}.

En tant que développeur web freelance spécialisé dans la conception et l'optimisation de sites web, je remarque que vous avez déjà une présence en ligne. C'est excellent !

Je serais ravi de discuter avec vous des opportunités d'optimisation et d'évolution possibles pour votre site, que ce soit pour :
• Améliorer les performances et la vitesse de chargement
• Optimiser le référencement (SEO)
• Ajouter de nouvelles fonctionnalités
• Améliorer l'expérience utilisateur
• Augmenter les conversions

Seriez-vous disponible pour un échange de 15 minutes afin de discuter de vos objectifs et de voir comment je peux vous accompagner dans l'évolution de votre présence digitale ?

Cordialement,

${signature}`;

  }

  return {
    subject,
    body
  };
}

