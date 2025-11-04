import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RequestBody {
  input: string;
}

interface ResponseData {
  predictions: Array<{
    description: string;
    place_id: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
  }>;
  error?: string;
}

/**
 * Fonction serverless pour l'autocomplétion des villes via Google Places
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      predictions: [],
      error: 'Method not allowed' 
    });
  }

  try {
    const { input } = req.body as RequestBody;

    if (!input || input.length < 2) {
      return res.status(200).json({ predictions: [] });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      return res.status(200).json({ 
        predictions: [],
        error: 'Google Places API key not configured'
      });
    }

    // Appel à l'API Google Places Autocomplete
    // Type: (cities) pour limiter aux villes
    // Components: country:fr pour limiter à la France
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&components=country:fr&key=${apiKey}&language=fr`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'OK' && data.predictions) {
      return res.status(200).json({
        predictions: data.predictions.map((pred: any) => ({
          description: pred.description,
          place_id: pred.place_id,
          structured_formatting: pred.structured_formatting || {
            main_text: pred.description.split(',')[0],
            secondary_text: pred.description.split(',').slice(1).join(',').trim()
          }
        }))
      });
    }

    // Si aucune prédiction trouvée
    return res.status(200).json({ predictions: [] });

  } catch (error) {
    console.error('Error with Google Places Autocomplete:', error);
    return res.status(200).json({
      predictions: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

