import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Download, Building2, Loader2, MapPin, Phone, Globe, Mail, ExternalLink, Eye, Filter, X, Copy, CheckCircle2, AlertCircle, Sparkles, Send, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { APE_CATEGORIES, getAPELabel } from '@/data/apeCategories';
import { DEPARTMENTS } from '@/data/departments';

// Fonction pour obtenir les villes principales d'un département
function getMainCitiesForDepartment(departmentCode: string): string[] {
  const citiesByDepartment: Record<string, string[]> = {
    '01': ['Bourg-en-Bresse', 'Oyonnax', 'Belley', 'Ambérieu-en-Bugey'],
    '02': ['Laon', 'Saint-Quentin', 'Soissons', 'Château-Thierry', 'Tergnier'],
    '03': ['Moulins', 'Montluçon', 'Vichy', 'Yzeure'],
    '04': ['Digne-les-Bains', 'Manosque', 'Sisteron', 'Château-Arnoux-Saint-Auban'],
    '05': ['Gap', 'Briançon', 'Embrun', 'Sisteron'],
    '06': ['Nice', 'Cannes', 'Antibes', 'Grasse', 'Menton'],
    '07': ['Privas', 'Aubenas', 'Annonay', 'Tournon-sur-Rhône', 'Valence', 'Le Teil', 'Largentière'],
    '08': ['Charleville-Mézières', 'Sedan', 'Rethel', 'Givet'],
    '09': ['Foix', 'Pamiers', 'Saint-Girons', 'Mirepoix'],
    '10': ['Troyes', 'Romilly-sur-Seine', 'Nogent-sur-Seine', 'Bar-sur-Aube'],
    '11': ['Carcassonne', 'Narbonne', 'Castelnaudary', 'Limoux'],
    '12': ['Rodez', 'Millau', 'Villefranche-de-Rouergue', 'Decazeville'],
    '13': ['Marseille', 'Aix-en-Provence', 'Arles', 'Aubagne', 'Martigues'],
    '14': ['Caen', 'Lisieux', 'Vire', 'Bayeux'],
    '15': ['Aurillac', 'Saint-Flour', 'Mauriac', 'Ytrac'],
    '16': ['Angoulême', 'Cognac', 'Ruffec', 'Confolens'],
    '17': ['La Rochelle', 'Rochefort', 'Saintes', 'Royan'],
    '18': ['Bourges', 'Vierzon', 'Aubigny-sur-Nère', 'Saint-Amand-Montrond'],
    '19': ['Tulle', 'Brive-la-Gaillarde', 'Ussel', 'Malemort'],
    '21': ['Dijon', 'Beaune', 'Montbard', 'Chenôve'],
    '22': ['Saint-Brieuc', 'Lannion', 'Dinan', 'Guingamp'],
    '23': ['Guéret', 'Aubusson', 'La Souterraine', 'Bourganeuf'],
    '24': ['Périgueux', 'Bergerac', 'Sarlat-la-Canéda', 'Nontron'],
    '25': ['Besançon', 'Montbéliard', 'Pontarlier', 'Audincourt'],
    '26': ['Valence', 'Romans-sur-Isère', 'Montélimar', 'Die'],
    '27': ['Évreux', 'Vernon', 'Les Andelys', 'Louviers'],
    '28': ['Chartres', 'Dreux', 'Nogent-le-Rotrou', 'Châteaudun'],
    '29': ['Quimper', 'Brest', 'Morlaix', 'Concarneau'],
    '2A': ['Ajaccio', 'Porto-Vecchio', 'Bastia', 'Propriano'],
    '2B': ['Bastia', 'Calvi', 'Corte', 'Porto-Vecchio'],
    '30': ['Nîmes', 'Alès', 'Uzès', 'Bagnols-sur-Cèze'],
    '31': ['Toulouse', 'Colomiers', 'Muret', 'Blagnac'],
    '32': ['Auch', 'Condom', 'Mirande', 'Lectoure'],
    '33': ['Bordeaux', 'Mérignac', 'Pessac', 'Talence'],
    '34': ['Montpellier', 'Béziers', 'Sète', 'Lunel'],
    '35': ['Rennes', 'Saint-Malo', 'Fougères', 'Vitré'],
    '36': ['Châteauroux', 'Issoudun', 'Le Blanc', 'La Châtre'],
    '37': ['Tours', 'Joué-lès-Tours', 'Amboise', 'Chinon'],
    '38': ['Grenoble', 'Valence', 'Vienne', 'Saint-Martin-d\'Hères'],
    '39': ['Lons-le-Saunier', 'Dole', 'Saint-Claude', 'Morez'],
    '40': ['Mont-de-Marsan', 'Dax', 'Saint-Sever', 'Aire-sur-l\'Adour'],
    '41': ['Blois', 'Vendôme', 'Romorantin-Lanthenay', 'Salbris'],
    '42': ['Saint-Étienne', 'Roanne', 'Montbrison', 'Firminy'],
    '43': ['Le Puy-en-Velay', 'Yssingeaux', 'Brioude', 'Monistrol-sur-Loire'],
    '44': ['Nantes', 'Saint-Nazaire', 'La Baule', 'Rezé'],
    '45': ['Orléans', 'Montargis', 'Pithiviers', 'Gien'],
    '46': ['Cahors', 'Figeac', 'Gourdon', 'Souillac'],
    '47': ['Agen', 'Marmande', 'Villeneuve-sur-Lot', 'Nérac'],
    '48': ['Mende', 'Florac', 'Marvejols', 'Langogne'],
    '49': ['Angers', 'Cholet', 'Saumur', 'Trélazé'],
    '50': ['Saint-Lô', 'Cherbourg', 'Coutances', 'Avranches'],
    '51': ['Reims', 'Châlons-en-Champagne', 'Épernay', 'Vitry-le-François'],
    '52': ['Chaumont', 'Saint-Dizier', 'Langres', 'Joinville'],
    '53': ['Laval', 'Mayenne', 'Château-Gontier', 'Ernée'],
    '54': ['Nancy', 'Lunéville', 'Toul', 'Longwy'],
    '55': ['Bar-le-Duc', 'Verdun', 'Commercy', 'Ligny-en-Barrois'],
    '56': ['Vannes', 'Lorient', 'Pontivy', 'Auray'],
    '57': ['Metz', 'Thionville', 'Sarreguemines', 'Forbach'],
    '58': ['Nevers', 'Cosne-Cours-sur-Loire', 'Clamecy', 'Decize'],
    '59': ['Lille', 'Roubaix', 'Tourcoing', 'Dunkirk'],
    '60': ['Beauvais', 'Compiègne', 'Clermont', 'Creil'],
    '61': ['Alençon', 'Flers', 'Argentan', 'Sées'],
    '62': ['Arras', 'Calais', 'Boulogne-sur-Mer', 'Lens'],
    '63': ['Clermont-Ferrand', 'Riom', 'Thiers', 'Cournon-d\'Auvergne'],
    '64': ['Pau', 'Bayonne', 'Oloron-Sainte-Marie', 'Anglet'],
    '65': ['Tarbes', 'Lourdes', 'Bagnères-de-Bigorre', 'Vic-en-Bigorre'],
    '67': ['Strasbourg', 'Mulhouse', 'Colmar', 'Haguenau'],
    '68': ['Colmar', 'Mulhouse', 'Thann', 'Guebwiller'],
    '69': ['Lyon', 'Villeurbanne', 'Vénissieux', 'Saint-Étienne'],
    '70': ['Vesoul', 'Lure', 'Gray', 'Héricourt'],
    '71': ['Mâcon', 'Chalon-sur-Saône', 'Autun', 'Le Creusot'],
    '72': ['Le Mans', 'La Flèche', 'Sablé-sur-Sarthe', 'Mamers'],
    '73': ['Chambéry', 'Albertville', 'Aix-les-Bains', 'Saint-Jean-de-Maurienne'],
    '74': ['Annecy', 'Thonon-les-Bains', 'Cluses', 'Annemasse'],
    '75': ['Paris'],
    '76': ['Rouen', 'Le Havre', 'Dieppe', 'Sotteville-lès-Rouen'],
    '77': ['Melun', 'Meaux', 'Fontainebleau', 'Provins'],
    '78': ['Versailles', 'Rambouillet', 'Mantes-la-Jolie', 'Sartrouville'],
    '79': ['Niort', 'Bressuire', 'Parthenay', 'Thouars'],
    '80': ['Amiens', 'Abbeville', 'Péronne', 'Albert'],
    '81': ['Albi', 'Castres', 'Mazamet', 'Gaillac'],
    '82': ['Montauban', 'Castelsarrasin', 'Moissac', 'Caussade'],
    '83': ['Toulon', 'Draguignan', 'Fréjus', 'Hyères'],
    '84': ['Avignon', 'Carpentras', 'Orange', 'Cavaillon'],
    '85': ['La Roche-sur-Yon', 'Les Sables-d\'Olonne', 'Fontenay-le-Comte', 'Challans'],
    '86': ['Poitiers', 'Châtellerault', 'Montmorillon', 'Loudun'],
    '87': ['Limoges', 'Saint-Junien', 'Bellac', 'Rochechouart'],
    '88': ['Épinal', 'Saint-Dié-des-Vosges', 'Remiremont', 'Neufchâteau'],
    '89': ['Auxerre', 'Sens', 'Avallon', 'Tonnerre'],
    '90': ['Belfort', 'Montbéliard', 'Delle', 'Valdoie'],
    '91': ['Évry', 'Corbeil-Essonnes', 'Palaiseau', 'Massy'],
    '92': ['Nanterre', 'Boulogne-Billancourt', 'Courbevoie', 'Asnières-sur-Seine'],
    '93': ['Bobigny', 'Saint-Denis', 'Aubervilliers', 'Montreuil'],
    '94': ['Créteil', 'Nogent-sur-Marne', 'Vincennes', 'Champigny-sur-Marne'],
    '95': ['Pontoise', 'Argenteuil', 'Sarcelles', 'Cergy'],
  };

  return citiesByDepartment[departmentCode] || [];
}

interface WebsiteAnalysis {
  exists: boolean;
  quality: 'excellent' | 'good' | 'poor' | 'none';
  score: number;
  issues: string[];
  hasMobileVersion: boolean;
  hasModernDesign: boolean;
  loadTime?: number;
}

interface Company {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email?: string;
  site_web?: string;
  hasWebsite: boolean;
  websiteAnalysis?: WebsiteAnalysis;
  emailFound?: boolean;
  emailSource?: 'website' | 'guessed' | 'api';
  apeCode: string;
  latitude?: number;
  longitude?: number;
}

// Les données mockées ont été supprimées - l'application utilise maintenant l'API Recherche Entreprises

export default function ProspectFinder() {
  const [city, setCity] = useState('');
  const [apeCodeOrName, setApeCodeOrName] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  
  // État pour la recherche rapide automatique
  const [quickSearchDepartment, setQuickSearchDepartment] = useState<string>('');
  const [quickSearchSector, setQuickSearchSector] = useState<string>('');
  const [quickSearchLimit, setQuickSearchLimit] = useState<number>(10);
  const [isQuickSearching, setIsQuickSearching] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  
  // État pour suivre les emails envoyés (persisté dans localStorage)
  const [emailsSent, setEmailsSent] = useState<Set<string>>(new Set());
  
  // Charger les emails envoyés depuis localStorage au démarrage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('prospectFinder_emailsSent');
      if (saved) {
        const emailsSentArray = JSON.parse(saved);
        setEmailsSent(new Set(emailsSentArray));
      }
    } catch (error) {
      console.error('Error loading emails sent from localStorage:', error);
    }
  }, []);

  // Sauvegarder les emails envoyés dans localStorage
  const saveEmailsSent = (newEmailsSent: Set<string>) => {
    try {
      localStorage.setItem('prospectFinder_emailsSent', JSON.stringify(Array.from(newEmailsSent)));
      setEmailsSent(newEmailsSent);
    } catch (error) {
      console.error('Error saving emails sent to localStorage:', error);
    }
  };

  // Fonction pour marquer/démarquer un email comme envoyé
  const toggleEmailSent = (companyId: string) => {
    const newEmailsSent = new Set(emailsSent);
    if (newEmailsSent.has(companyId)) {
      newEmailsSent.delete(companyId);
    } else {
      newEmailsSent.add(companyId);
    }
    saveEmailsSent(newEmailsSent);
  };
  
  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  
  // État pour le filtrage par catégories APE
  const [selectedAPECategories, setSelectedAPECategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'ape' | 'website'>('name');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterEmailSent, setFilterEmailSent] = useState<'all' | 'sent' | 'notSent'>('all');
  
  // État pour les adresses visibles
  const [visibleAddresses, setVisibleAddresses] = useState<Set<string>>(new Set());
  
  // État pour l'autocomplétion
  interface CitySuggestion {
    description: string;
    place_id: string;
    structured_formatting?: {
      main_text: string;
      secondary_text: string;
    };
  }
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fonction pour l'autocomplétion des villes
  const fetchCitySuggestions = async (input: string) => {
    if (input.length < 2) {
      setCitySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/autocompleteCities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      if (response.ok) {
        const data = await response.json();
        setCitySuggestions(data.predictions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
      setCitySuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Debounce pour l'autocomplétion
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (city) {
        fetchCitySuggestions(city);
      } else {
        setCitySuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        cityInputRef.current &&
        !cityInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sélectionner une ville depuis les suggestions
  const selectCity = (suggestion: CitySuggestion) => {
    // Extraire juste le nom de la ville (première partie avant la virgule)
    const cityName = suggestion.description.split(',')[0].trim();
    setCity(cityName);
    setShowSuggestions(false);
    setCitySuggestions([]);
  };

  // Fonction pour vérifier le site web d'une entreprise
  const checkWebsite = async (company: Company): Promise<{ hasWebsite: boolean; website?: string }> => {
    try {
      const response = await fetch('/api/checkWebsite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: company.name,
          city: company.city,
          address: `${company.address}, ${company.postalCode} ${company.city}`,
        }),
      });

      if (!response.ok) {
        console.warn('API checkWebsite not available');
        return {
          hasWebsite: false,
          website: undefined,
        };
      }

      const data = await response.json();
      return {
        hasWebsite: data.hasWebsite || false,
        website: data.website || undefined,
      };
    } catch (error) {
      console.warn('Error checking website:', error);
      return {
        hasWebsite: false,
        website: undefined,
      };
    }
  };

  // Fonction pour analyser la qualité d'un site web
  const analyzeWebsite = async (website: string, companyName: string): Promise<WebsiteAnalysis | null> => {
    try {
      const response = await fetch('/api/analyzeWebsite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          website,
          companyName,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error analyzing website:', error);
      return null;
    }
  };

  // Fonction pour trouver l'email d'une entreprise
  const findEmail = async (company: Company): Promise<{ email: string; source: 'website' | 'guessed' | 'api' } | null> => {
    try {
      const response = await fetch('/api/findEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: company.name,
          website: company.site_web,
          city: company.city,
          address: `${company.address}, ${company.postalCode} ${company.city}`,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.found && data.email) {
        return {
          email: data.email,
          source: data.source || 'guessed'
        };
      }
      return null;
    } catch (error) {
      console.error('Error finding email:', error);
      return null;
    }
  };

  // Fonction pour générer un email de prospection
  const generateProspectEmail = async (company: Company, contactName?: string) => {
    try {
      setIsGeneratingEmail(true);
      const response = await fetch('/api/generateProspectEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: company.name,
          contactName,
          websiteStatus: company.websiteAnalysis?.quality || (company.hasWebsite ? 'good' : 'none'),
          websiteUrl: company.site_web,
          companyCity: company.city,
          companyActivity: getAPELabel(company.apeCode),
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération de l\'email');
      }

      const data = await response.json();
      setGeneratedEmail(data);
      setIsEmailDialogOpen(true);
    } catch (error) {
      console.error('Error generating email:', error);
      setError('Erreur lors de la génération de l\'email');
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  // Fonction pour copier l'email dans le presse-papier
  const copyEmailToClipboard = () => {
    if (generatedEmail) {
      const fullEmail = `Objet: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
      navigator.clipboard.writeText(fullEmail);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    }
  };

  // Fonction pour charger une page de résultats
  const loadPage = async (page: number, isNewSearch: boolean = false) => {
    if (isNewSearch) {
      setIsLoading(true);
      setCurrentPage(1);
      setResults([]);
    } else {
      setIsLoadingPage(true);
    }
    
    setError(null);
    setScanProgress(0);

    try {
      const response = await fetch('/api/searchCompanies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          city: city,
          apeCodeOrName: apeCodeOrName || undefined,
          page: page,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }

      const data = await response.json();

      if (data.error) {
        setError(`Erreur: ${data.error}`);
        setIsLoading(false);
        setIsLoadingPage(false);
        return;
      }

      // Transformer les résultats en format Company avec hasWebsite initialisé à false
      let newResults: Company[] = (data.companies || []).map((company: any) => ({
        ...company,
        hasWebsite: false, // Sera mis à jour lors du scan
        site_web: '',
      }));

      // Si nouvelle recherche, remplacer les résultats, sinon ajouter
      if (isNewSearch) {
        setResults(newResults);
      } else {
        setResults(prev => [...prev, ...newResults]);
      }

      setHasMorePages(data.hasMore || false);
      setCurrentPage(page);

      if (isNewSearch) {
        setIsLoading(false);
        setHasSearched(true);

        // Scanner les sites web pour la première page uniquement
        if (newResults.length > 0) {
          setIsScanning(true);
          setScanProgress(0);

          try {
            const updatedResults = await Promise.all(
              newResults.map(async (company, index) => {
                const websiteCheck = await checkWebsite(company);
                setScanProgress(((index + 1) / newResults.length) * 50); // 50% pour la vérification

                let websiteAnalysis: WebsiteAnalysis | undefined;
                let email: string | undefined;
                let emailFound = false;
                let emailSource: 'website' | 'guessed' | 'api' | undefined;

                // Si le site existe, analyser sa qualité
                if (websiteCheck.hasWebsite && websiteCheck.website) {
                  websiteAnalysis = await analyzeWebsite(websiteCheck.website, company.name) || undefined;
                  setScanProgress(50 + ((index + 1) / newResults.length) * 30); // 30% pour l'analyse
                  
                  // Chercher l'email
                  const emailResult = await findEmail(company);
                  if (emailResult) {
                    email = emailResult.email;
                    emailFound = true;
                    emailSource = emailResult.source;
                  }
                  setScanProgress(80 + ((index + 1) / newResults.length) * 20); // 20% pour l'email
                } else {
                  // Même sans site, essayer de trouver un email
                  const emailResult = await findEmail(company);
                  if (emailResult) {
                    email = emailResult.email;
                    emailFound = true;
                    emailSource = emailResult.source;
                  }
                  setScanProgress(50 + ((index + 1) / newResults.length) * 50);
                }

                return {
                  ...company,
                  hasWebsite: websiteCheck.hasWebsite,
                  site_web: websiteCheck.website || company.site_web || '',
                  websiteAnalysis,
                  email: email || company.email,
                  emailFound,
                  emailSource,
                };
              })
            );

            setResults(updatedResults);
          } catch (scanError) {
            console.error('Error during website scan:', scanError);
            setResults(newResults);
          } finally {
            setIsScanning(false);
            setScanProgress(100);
          }
        }
      } else {
        setIsLoadingPage(false);
      }

      // Si aucune entreprise trouvée et c'est une nouvelle recherche
      if (isNewSearch && newResults.length === 0) {
        setError(`Aucune entreprise trouvée pour "${city}"${apeCodeOrName ? ` avec "${apeCodeOrName}"` : ''}. Essayez avec une autre ville ou un autre critère.`);
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la recherche');
      setIsLoading(false);
      setIsLoadingPage(false);
      setIsScanning(false);
    }
  };

  const handleSearch = async () => {
    if (!city && !apeCodeOrName) {
      setError('Veuillez remplir au moins un champ (Ville ou Code APE/Nom)');
      return;
    }

    // Charger la première page
    await loadPage(1, true);
  };

  // Fonction de recherche rapide automatique
  const handleQuickSearch = async () => {
    if (!quickSearchDepartment || !quickSearchSector) {
      setError('Veuillez sélectionner un département et un secteur d\'activité');
      return;
    }

    setIsQuickSearching(true);
    setError(null);
    setResults([]);
    setHasSearched(false);
    setIsLoading(true);
    setScanProgress(0);

    try {
      const department = DEPARTMENTS.find(d => d.code === quickSearchDepartment);
      const departmentCode = quickSearchDepartment;
      
      // Stratégie de recherche améliorée :
      // 1. D'abord essayer une recherche directe par département + code APE (sans ville)
      // 2. Si pas assez de résultats, essayer avec les villes principales
      // 3. Essayer aussi avec le code APE sans la lettre finale pour plus de résultats
      
      let newResults: Company[] = [];
      
      // Étape 1 : Recherche directe par département + code APE
      console.log('Trying direct search by department + APE code...');
      try {
        let currentPage = 1;
        const maxPages = 5; // 5 pages pour la recherche directe (125 résultats max)
        
        while (newResults.length < quickSearchLimit && currentPage <= maxPages) {
          const response = await fetch('/api/searchCompanies', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              departmentCode: departmentCode, // Recherche directe par département
              apeCodeOrName: quickSearchSector,
              page: currentPage,
              limit: 25,
            }),
          });

          if (!response.ok) break;

          const data = await response.json();

          if (data.error || !data.companies || data.companies.length === 0) {
            break;
          }

          const pageResults: Company[] = data.companies.map((company: any) => ({
            ...company,
            hasWebsite: false,
            site_web: '',
          }));

          newResults = [...newResults, ...pageResults];
          
          if (data.companies.length < 25) {
            break; // Dernière page
          }
          
          currentPage++;
        }
        
        console.log(`Direct search found ${newResults.length} companies`);
      } catch (error) {
        console.warn('Error in direct search:', error);
      }
      
      // Étape 2 : Si pas assez de résultats, essayer avec le code APE sans la lettre finale
      if (newResults.length < quickSearchLimit && /^\d{4}[A-Z]$/.test(quickSearchSector.toUpperCase())) {
        const apeCodeWithoutLetter = quickSearchSector.substring(0, 4);
        console.log(`Trying with APE code without letter: ${apeCodeWithoutLetter}...`);
        
        try {
          let currentPage = 1;
          const maxPages = 3;
          
          while (newResults.length < quickSearchLimit && currentPage <= maxPages) {
            const response = await fetch('/api/searchCompanies', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                departmentCode: departmentCode,
                apeCodeOrName: apeCodeWithoutLetter, // Code APE sans la lettre
                page: currentPage,
                limit: 25,
              }),
            });

            if (!response.ok) break;

            const data = await response.json();

            if (data.error || !data.companies || data.companies.length === 0) {
              break;
            }

            const pageResults: Company[] = data.companies.map((company: any) => ({
              ...company,
              hasWebsite: false,
              site_web: '',
            }));

            // Filtrer pour garder seulement ceux qui correspondent au code APE complet
            const filteredResults = pageResults.filter(company => 
              company.apeCode && company.apeCode.startsWith(quickSearchSector.substring(0, 4))
            );

            // Ajouter seulement les résultats uniques
            const uniqueResults = filteredResults.filter(company => 
              !newResults.some(r => r.id === company.id)
            );

            newResults = [...newResults, ...uniqueResults];
            
            if (data.companies.length < 25) {
              break;
            }
            
            currentPage++;
          }
          
          console.log(`Search with APE code without letter found ${newResults.length} total companies`);
        } catch (error) {
          console.warn('Error in search with APE code without letter:', error);
        }
      }
      
      // Étape 3 : Si toujours pas assez, essayer avec les villes principales
      if (newResults.length < quickSearchLimit) {
        const mainCities = getMainCitiesForDepartment(departmentCode);
        console.log(`Trying with cities: ${mainCities.join(', ')}...`);
        
        for (const city of mainCities) {
          if (newResults.length >= quickSearchLimit) break;
          
          let currentPage = 1;
          const maxPages = 2; // 2 pages par ville (50 résultats max par ville)
          
          while (newResults.length < quickSearchLimit && currentPage <= maxPages) {
            try {
              const response = await fetch('/api/searchCompanies', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  city: city,
                  departmentCode: departmentCode,
                  apeCodeOrName: quickSearchSector,
                  page: currentPage,
                  limit: 25,
                }),
              });

              if (!response.ok) break;

              const data = await response.json();

              if (data.error || !data.companies || data.companies.length === 0) {
                break;
              }

              const pageResults: Company[] = data.companies.map((company: any) => ({
                ...company,
                hasWebsite: false,
                site_web: '',
              }));

              // Ajouter seulement les résultats uniques
              const uniqueResults = pageResults.filter(company => 
                !newResults.some(r => r.id === company.id)
              );

              newResults = [...newResults, ...uniqueResults];
              
              if (data.companies.length < 25) {
                break;
              }
              
              currentPage++;
            } catch (error) {
              console.warn(`Error searching in ${city}:`, error);
              break;
            }
          }
        }
        
        console.log(`Total found after all searches: ${newResults.length} companies`);
      }

      // Limiter le nombre de résultats
      newResults = newResults.slice(0, quickSearchLimit);

      setResults(newResults);
      setIsLoading(false);
      setHasSearched(true);

      // Scanner les sites web
      if (newResults.length > 0) {
        setIsScanning(true);
        setScanProgress(0);

        try {
          const updatedResults = await Promise.all(
            newResults.map(async (company, index) => {
              const websiteCheck = await checkWebsite(company);
              setScanProgress(((index + 1) / newResults.length) * 50);

              let websiteAnalysis: WebsiteAnalysis | undefined;
              let email: string | undefined;
              let emailFound = false;
              let emailSource: 'website' | 'guessed' | 'api' | undefined;

              if (websiteCheck.hasWebsite && websiteCheck.website) {
                websiteAnalysis = await analyzeWebsite(websiteCheck.website, company.name) || undefined;
                setScanProgress(50 + ((index + 1) / newResults.length) * 30);
                
                const emailResult = await findEmail(company);
                if (emailResult) {
                  email = emailResult.email;
                  emailFound = true;
                  emailSource = emailResult.source;
                }
                setScanProgress(80 + ((index + 1) / newResults.length) * 20);
              } else {
                const emailResult = await findEmail(company);
                if (emailResult) {
                  email = emailResult.email;
                  emailFound = true;
                  emailSource = emailResult.source;
                }
                setScanProgress(50 + ((index + 1) / newResults.length) * 50);
              }

              return {
                ...company,
                hasWebsite: websiteCheck.hasWebsite,
                site_web: websiteCheck.website || company.site_web || '',
                websiteAnalysis,
                email: email || company.email,
                emailFound,
                emailSource,
              };
            })
          );

          setResults(updatedResults);
        } catch (scanError) {
          console.error('Error during website scan:', scanError);
          setResults(newResults);
        } finally {
          setIsScanning(false);
          setScanProgress(100);
        }
      }

      if (newResults.length === 0) {
        setError(`Aucune entreprise trouvée dans le département ${department?.name || departmentCode} (${departmentCode}) pour le secteur ${getAPELabel(quickSearchSector)}. Essayez avec un autre département ou secteur.`);
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la recherche rapide');
      setIsLoading(false);
      setIsScanning(false);
    } finally {
      setIsQuickSearching(false);
    }
  };

  const loadNextPage = async () => {
    if (hasMorePages && !isLoadingPage) {
      await loadPage(currentPage + 1, false);
    }
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSelectedAPECategories([]);
    setSortBy('name');
    setFilterEmailSent('all');
  };

  // Calcul des catégories disponibles dans les résultats
  // Pour l'affichage, on est plus permissif (préfixe de 4 caractères) pour montrer les secteurs disponibles
  // Le filtrage réel sera strict (correspondance exacte uniquement)
  const availableCategories = useMemo(() => {
    if (results.length === 0) return new Set<string>();
    
    const available = new Set<string>();
    const normalizedResultCodes = results
      .map(c => c.apeCode)
      .filter(Boolean)
      .map(code => code.toUpperCase().replace(/\./g, '').replace(/\s/g, '').trim());
    
    // Log pour déboguer
    const uniqueResultCodes = [...new Set(normalizedResultCodes)];
    if (uniqueResultCodes.length > 0) {
      console.log('Codes APE normalisés dans les résultats:', uniqueResultCodes.slice(0, 20)); // Limiter l'affichage
    }
    
    APE_CATEGORIES.forEach(category => {
      const categoryCode = category.code.toUpperCase().replace(/\./g, '').replace(/\s/g, '').trim();
      const categoryPrefix = categoryCode.length >= 4 ? categoryCode.substring(0, 4) : categoryCode;
      
      // Pour l'affichage des catégories disponibles, on accepte par préfixe (4 premiers caractères)
      // Cela permet de montrer qu'il y a des entreprises dans ce secteur
      const matches = normalizedResultCodes.some(resultCode => {
        // Correspondance exacte
        if (resultCode === categoryCode) {
          console.log(`✓ Catégorie disponible (exacte): ${category.label} (${category.code}) = ${resultCode}`);
          return true;
        }
        // Correspondance par préfixe (4 premiers caractères) pour montrer les secteurs disponibles
        if (resultCode.length >= 4 && categoryPrefix.length === 4) {
          const resultPrefix = resultCode.substring(0, 4);
          if (resultPrefix === categoryPrefix) {
            console.log(`✓ Catégorie disponible (préfixe): ${category.label} (${category.code}, préfixe ${categoryPrefix}) = ${resultCode} (préfixe ${resultPrefix})`);
            return true;
          }
        }
        // Correspondance stricte : même longueur et commence par le code catégorie
        if (resultCode.startsWith(categoryCode) && resultCode.length === categoryCode.length) {
          console.log(`✓ Catégorie disponible (startsWith): ${category.label} (${category.code}) = ${resultCode}`);
          return true;
        }
        return false;
      });
      
      if (matches) {
        available.add(category.code);
      }
    });
    
    console.log(`Catégories disponibles détectées: ${Array.from(available).join(', ')}`);
    return available;
  }, [results]);

  // Calcul des résultats filtrés et triés
  const filteredAndSortedResults = useMemo(() => {
    let filtered = [...results];

    // Filtrer par statut d'email envoyé
    if (filterEmailSent === 'sent') {
      filtered = filtered.filter(company => emailsSent.has(company.id));
    } else if (filterEmailSent === 'notSent') {
      filtered = filtered.filter(company => !emailsSent.has(company.id));
    }

    // Filtrer par catégories APE si des catégories sont sélectionnées
    if (selectedAPECategories.length > 0) {
      // Debug: Afficher les codes APE disponibles dans les résultats
      if (filtered.length > 0) {
        const uniqueApeCodes = [...new Set(filtered.map(c => c.apeCode).filter(Boolean))];
        console.log('Codes APE disponibles dans les résultats:', uniqueApeCodes);
        console.log('Catégories sélectionnées:', selectedAPECategories);
        console.log('Catégories disponibles dans les résultats:', Array.from(availableCategories));
      }
      
      filtered = filtered.filter(company => {
        // Ignorer les entreprises sans code APE si on filtre
        if (!company.apeCode || company.apeCode.trim() === '') {
          return false;
        }
        
        // Normaliser le code APE de l'entreprise (enlever les points, espaces, mettre en majuscule)
        // Format API: '47.11D' -> '4711D'
        const companyApeCode = company.apeCode
          .toUpperCase()
          .replace(/\./g, '') // Enlever les points (ex: 47.11D -> 4711D, 56.10A -> 5610A)
          .replace(/\s/g, '') // Enlever les espaces
          .trim();
        
        const matches = selectedAPECategories.some(categoryCode => {
          // Normaliser le code de catégorie (déjà sans point normalement, mais on normalise quand même)
          // Format catégorie: '4711D' ou '5610C'
          const categoryApeCode = categoryCode
            .toUpperCase()
            .replace(/\./g, '')
            .replace(/\s/g, '')
            .trim();
          
          // Comparaison exacte uniquement (ex: 4711D === 4711D, 5610C === 5610C)
          // Ne pas faire de correspondance par préfixe car 56.10A (Restauration) ≠ 56.10C (Cafés)
          if (companyApeCode === categoryApeCode) {
            console.log(`✓ Match exact: ${company.name} (${company.apeCode} -> ${companyApeCode} === ${categoryApeCode})`);
            return true;
          }
          
          // Comparaison stricte : seulement si le code de l'entreprise commence par le code de catégorie complet
          // (pour les cas où le code API retourne une sous-variante, mais pas pour des catégories différentes)
          // Par exemple, si on cherche '5610C', on accepte '5610C' mais pas '5610A'
          if (companyApeCode.startsWith(categoryApeCode) && companyApeCode.length === categoryApeCode.length) {
            console.log(`✓ Match exact (startsWith même longueur): ${company.name} (${company.apeCode} -> ${companyApeCode} === ${categoryApeCode})`);
            return true;
          }
          
          return false;
        });
        
        return matches;
      });
      
      console.log(`Filtrage: ${results.length} -> ${filtered.length} entreprises`);
    }

    // Trier selon le critère sélectionné
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'fr');
        case 'ape':
          return a.apeCode.localeCompare(b.apeCode);
        case 'website':
          // Mettre ceux sans site web en premier
          if (a.hasWebsite === b.hasWebsite) {
            return a.name.localeCompare(b.name, 'fr');
          }
          return a.hasWebsite ? 1 : -1;
        default:
          return 0;
      }
    });

    return sorted;
  }, [results, selectedAPECategories, sortBy, availableCategories, filterEmailSent, emailsSent]);

  const exportToCSV = () => {
    const headers = ['Nom', 'Adresse', 'Code Postal', 'Ville', 'Téléphone', 'Email', 'Email Source', 'Site Web', 'Qualité Site', 'Score Site', 'Code APE', 'Catégorie', 'Email Envoyé'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedResults.map(company =>
        [
          `"${company.name}"`,
          `"${company.address}"`,
          `"${company.postalCode}"`,
          `"${company.city}"`,
          `"${company.phone}"`,
          `"${company.email || ''}"`,
          `"${company.emailSource || ''}"`,
          `"${company.site_web || ''}"`,
          `"${company.websiteAnalysis?.quality || (company.hasWebsite ? 'Non analysé' : 'Aucun')}"`,
          company.websiteAnalysis?.score?.toString() || '',
          company.apeCode,
          `"${getAPELabel(company.apeCode)}"`,
          emailsSent.has(company.id) ? 'Oui' : 'Non'
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `prospection_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openCompanyDetails = (company: Company) => {
    setSelectedCompany(company);
    setIsDialogOpen(true);
  };

  const toggleAddressVisibility = (companyId: string) => {
    setVisibleAddresses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(companyId)) {
        newSet.delete(companyId);
      } else {
        newSet.add(companyId);
      }
      return newSet;
    });
  };

  const getGoogleMapsUrl = (company: Company) => {
    if (company.latitude && company.longitude) {
      return `https://www.google.com/maps?q=${company.latitude},${company.longitude}`;
    }
    const address = `${company.address}, ${company.postalCode} ${company.city}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  // Statistiques
  const totalCompanies = results.length;
  const companiesWithWebsite = results.filter(c => c.hasWebsite).length;
  const companiesWithoutWebsite = totalCompanies - companiesWithWebsite;
  const percentageWithoutWebsite = totalCompanies > 0 
    ? Math.round((companiesWithoutWebsite / totalCompanies) * 100) 
    : 0;

  const chartData = [
    { name: 'Avec site web', value: companiesWithWebsite, color: '#10b981' },
    { name: 'Sans site web', value: companiesWithoutWebsite, color: '#ef4444' },
  ];

  const chartConfig = {
    'Avec site web': { label: 'Avec site web', color: '#10b981' },
    'Sans site web': { label: 'Sans site web', color: '#ef4444' },
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-3 sm:space-y-4 pt-4 sm:pt-6 md:pt-8 px-2"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <Building2 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-cyan-400 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              ProspectFinder
            </h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
            Identifiez instantanément les entreprises sans présence en ligne dans votre secteur
          </p>
        </motion.div>

        {/* Onglets de recherche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setShowQuickSearch(false)}
              variant={!showQuickSearch ? "default" : "outline"}
              className={!showQuickSearch 
                ? "bg-cyan-500 hover:bg-cyan-600 text-white" 
                : "border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"
              }
            >
              <Search className="mr-2 h-4 w-4" />
              Recherche manuelle
            </Button>
            <Button
              onClick={() => setShowQuickSearch(true)}
              variant={showQuickSearch ? "default" : "outline"}
              className={showQuickSearch 
                ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                : "border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10"
              }
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Recherche automatique
            </Button>
          </div>
        </motion.div>

        {/* Formulaire de recherche rapide */}
        {showQuickSearch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-2xl border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-emerald-400" />
                  Recherche automatique de prospects
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Trouvez automatiquement 5 à 10 entreprises ciblées par département et secteur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-400" />
                      Département
                    </label>
                    <Select value={quickSearchDepartment} onValueChange={setQuickSearchDepartment}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-100">
                        <SelectValue placeholder="Sélectionner un département" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept.code} value={dept.code}>
                            {dept.code} - {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-emerald-400" />
                      Secteur d'activité
                    </label>
                    <Select value={quickSearchSector} onValueChange={setQuickSearchSector}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-100">
                        <SelectValue placeholder="Sélectionner un secteur" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {APE_CATEGORIES.map((category) => (
                          <SelectItem key={category.code} value={category.code}>
                            {category.label} ({category.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-emerald-400" />
                      Nombre de résultats
                    </label>
                    <Select 
                      value={quickSearchLimit.toString()} 
                      onValueChange={(value) => setQuickSearchLimit(parseInt(value))}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 entreprises</SelectItem>
                        <SelectItem value="10">10 entreprises</SelectItem>
                        <SelectItem value="15">15 entreprises</SelectItem>
                        <SelectItem value="20">20 entreprises</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                      <Button
                        onClick={handleQuickSearch}
                        disabled={isQuickSearching || isLoading || isScanning || !quickSearchDepartment || !quickSearchSector}
                        className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all duration-300"
                      >
                        {isQuickSearching || isLoading || isScanning ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isScanning ? 'Analyse en cours...' : 'Recherche...'}
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Lancer la recherche
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Formulaire de recherche manuelle */}
        {!showQuickSearch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-100 flex items-center gap-2">
                  <Search className="h-6 w-6 text-cyan-400" />
                  Recherche d'entreprises
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Recherchez des entreprises par ville et code APE ou nom
                </CardDescription>
              </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2 relative">
                  <label className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-400" />
                    Ville
                  </label>
                  <div className="relative">
                    <Input
                      ref={cityInputRef}
                      placeholder="ex: Paris, Lyon, Reims..."
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      onFocus={() => citySuggestions.length > 0 && setShowSuggestions(true)}
                      className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20 transition-all text-sm sm:text-base"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (showSuggestions && citySuggestions.length > 0) {
                            selectCity(citySuggestions[0]);
                          } else {
                            handleSearch();
                          }
                        } else if (e.key === 'Escape') {
                          setShowSuggestions(false);
                        }
                      }}
                    />
                    {isLoadingSuggestions && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-cyan-400" />
                    )}
                    
                    {/* Suggestions d'autocomplétion */}
                    {showSuggestions && citySuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        ref={suggestionsRef}
                        className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                      >
                        {citySuggestions.map((suggestion) => (
                          <button
                            key={suggestion.place_id}
                            type="button"
                            onClick={() => selectCity(suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-b-0"
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-100 text-sm font-medium truncate">
                                  {suggestion.structured_formatting?.main_text || suggestion.description.split(',')[0]}
                                </p>
                                {suggestion.structured_formatting?.secondary_text && (
                                  <p className="text-slate-400 text-xs truncate">
                                    {suggestion.structured_formatting.secondary_text}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400" />
                    Code APE ou Nom entreprise
                  </label>
                  <Input
                    placeholder="ex: 5610A ou Restaurant..."
                    value={apeCodeOrName}
                    onChange={(e) => setApeCodeOrName(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20 transition-all text-sm sm:text-base"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>

                <div className="flex items-end sm:col-span-2 md:col-span-1">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                    <Button
                      onClick={handleSearch}
                      disabled={isLoading || isScanning}
                      className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-300 text-sm sm:text-base"
                    >
                      {isLoading || isScanning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isScanning ? 'Scan en cours...' : 'Recherche...'}
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Rechercher
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Barre de progression du scan */}
              {isScanning && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Vérification des sites web...</span>
                    <span>{Math.round(scanProgress)}%</span>
                  </div>
                  <Progress 
                    value={scanProgress} 
                    className="h-2 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-emerald-500" 
                  />
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        )}

        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
                    <p className="text-slate-400 animate-pulse">Analyse des entreprises en cours...</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {!isLoading && hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl text-slate-100">
                      Résultats de recherche
                    </CardTitle>
                    <CardDescription className="text-slate-400 mt-2">
                      {totalCompanies} entreprise{totalCompanies > 1 ? 's' : ''} trouvée{totalCompanies > 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  {results.length > 0 && (
                    <div className="flex gap-2">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={() => setShowFilterPanel(!showFilterPanel)}
                          variant={showFilterPanel ? "default" : "outline"}
                          className={showFilterPanel 
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                            : "border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-300 transition-all duration-300"
                          }
                        >
                          <Filter className="mr-2 h-4 w-4" />
                          {showFilterPanel ? 'Masquer filtres' : 'Filtres et tri'}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={exportToCSV}
                          variant="outline"
                          className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-300 transition-all duration-300"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Exporter CSV
                        </Button>
                      </motion.div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Panel de filtres */}
                <AnimatePresence>
                  {showFilterPanel && results.length > 0 && (
                    <motion.div
                      key="filter-panel"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border border-slate-700 rounded-lg p-4 bg-slate-800/50"
                    >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                        <Filter className="h-5 w-5 text-emerald-400" />
                        Filtres et tri
                      </h3>
                      <div className="flex gap-2">
                        {(selectedAPECategories.length > 0 || sortBy !== 'name' || filterEmailSent !== 'all') && (
                          <Button
                            onClick={resetFilters}
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-slate-200"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Réinitialiser
                          </Button>
                        )}
                        <Button
                          onClick={() => setShowFilterPanel(false)}
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Tri */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Trier par</label>
                        <Select value={sortBy} onValueChange={(value: 'name' | 'ape' | 'website') => setSortBy(value)}>
                          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Nom (A-Z)</SelectItem>
                            <SelectItem value="ape">Code APE</SelectItem>
                            <SelectItem value="website">Sans site web d'abord</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filtre par email envoyé */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                          <Send className="h-4 w-4 text-emerald-400" />
                          Filtrer par email envoyé
                        </label>
                        <Select value={filterEmailSent} onValueChange={(value: 'all' | 'sent' | 'notSent') => setFilterEmailSent(value)}>
                          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="sent">Emails envoyés uniquement</SelectItem>
                            <SelectItem value="notSent">Emails non envoyés uniquement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filtres par catégories APE */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Filtrer par catégorie</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border border-slate-700 rounded-lg bg-slate-900/30">
                          {APE_CATEGORIES.map((category) => {
                            const isChecked = selectedAPECategories.includes(category.code);
                            const isAvailable = availableCategories.has(category.code);
                            return (
                              <div 
                                key={category.code} 
                                className={`flex items-center space-x-2 p-2 rounded transition-colors ${
                                  isChecked 
                                    ? 'bg-emerald-500/10 border border-emerald-500/30' 
                                    : isAvailable
                                    ? 'hover:bg-slate-700/50'
                                    : 'opacity-50 cursor-not-allowed bg-slate-800/30'
                                }`}
                              >
                                <Checkbox
                                  id={`ape-${category.code}`}
                                  checked={isChecked}
                                  disabled={!isAvailable}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedAPECategories(prev => [...prev, category.code]);
                                    } else {
                                      setSelectedAPECategories(prev => prev.filter(code => code !== category.code));
                                    }
                                  }}
                                  className={`border-slate-400 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 ${
                                    !isAvailable ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                />
                                <label
                                  htmlFor={`ape-${category.code}`}
                                  className={`text-sm cursor-pointer flex-1 ${
                                    isAvailable ? 'text-slate-300' : 'text-slate-500'
                                  }`}
                                >
                                  <div className="font-medium">{category.label}</div>
                                  <div className="text-xs text-slate-500">
                                    {category.code}
                                    {!isAvailable && results.length > 0 && (
                                      <span className="ml-1 text-slate-600">(non disponible)</span>
                                    )}
                                  </div>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {results.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <Building2 className="h-16 w-16 mx-auto text-slate-700" />
                    <p className="text-slate-400 text-lg">Aucune entreprise trouvée</p>
                    <p className="text-slate-500 text-sm">Essayez d'élargir vos critères de recherche</p>
                  </div>
                ) : filteredAndSortedResults.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <Filter className="h-16 w-16 mx-auto text-slate-700" />
                    <p className="text-slate-400 text-lg">Aucune entreprise ne correspond aux filtres</p>
                    <Button
                      onClick={resetFilters}
                      variant="outline"
                      className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"
                    >
                      Réinitialiser les filtres
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Statistiques */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      <Card className="border-slate-800 bg-slate-800/30">
                        <CardContent className="pt-4 sm:pt-6">
                          <div className="text-center space-y-2">
                            <p className="text-slate-400 text-xs sm:text-sm">Total d'entreprises</p>
                            <p className="text-2xl sm:text-3xl font-bold text-cyan-400">{totalCompanies}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-800 bg-slate-800/30">
                        <CardContent className="pt-4 sm:pt-6">
                          <div className="text-center space-y-2">
                            <p className="text-slate-400 text-xs sm:text-sm">Sans site web</p>
                            <p className="text-2xl sm:text-3xl font-bold text-rose-400">{companiesWithoutWebsite}</p>
                            <p className="text-xs text-slate-500">{percentageWithoutWebsite}%</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-800 bg-slate-800/30">
                        <CardContent className="pt-4 sm:pt-6">
                          <div className="text-center space-y-2">
                            <p className="text-slate-400 text-xs sm:text-sm">Avec site web</p>
                            <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{companiesWithWebsite}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-800 bg-slate-800/30">
                        <CardContent className="pt-4 sm:pt-6">
                          <div className="text-center space-y-2">
                            <p className="text-slate-400 text-xs sm:text-sm flex items-center justify-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Emails envoyés
                            </p>
                            <p className="text-2xl sm:text-3xl font-bold text-purple-400">
                              {results.filter(c => emailsSent.has(c.id)).length}
                            </p>
                            <p className="text-xs text-slate-500">
                              {totalCompanies > 0 
                                ? Math.round((results.filter(c => emailsSent.has(c.id)).length / totalCompanies) * 100) 
                                : 0}%
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Graphique */}
                    {totalCompanies > 0 && (
                      <Card className="border-slate-800 bg-slate-800/30">
                        <CardHeader>
                          <CardTitle className="text-base sm:text-lg text-slate-100">Répartition avec/sans site web</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={chartData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </CardContent>
                      </Card>
                    )}

                    {/* Tableau */}
                    <div className="rounded-lg border border-slate-800 overflow-hidden w-full">
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="inline-block min-w-full align-middle">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
                                <TableHead className="text-cyan-400 font-semibold text-xs sm:text-sm">Nom</TableHead>
                                <TableHead className="text-cyan-400 font-semibold text-xs sm:text-sm hidden lg:table-cell">Téléphone</TableHead>
                                <TableHead className="text-cyan-400 font-semibold text-xs sm:text-sm">Code APE</TableHead>
                                <TableHead className="text-cyan-400 font-semibold text-xs sm:text-sm">Site web</TableHead>
                                <TableHead className="text-cyan-400 font-semibold text-xs sm:text-sm hidden md:table-cell">Qualité</TableHead>
                                <TableHead className="text-cyan-400 font-semibold text-xs sm:text-sm hidden lg:table-cell">Email</TableHead>
                                <TableHead className="text-cyan-400 font-semibold text-xs sm:text-sm text-center">Email envoyé</TableHead>
                                <TableHead className="text-cyan-400 font-semibold text-xs sm:text-sm">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <AnimatePresence>
                                {filteredAndSortedResults.map((company, index) => (
                                  <>
                                    <motion.tr
                                      key={company.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ delay: index * 0.05 }}
                                      className="bg-slate-900/30 hover:bg-slate-800/30 transition-colors duration-200"
                                    >
                                      <TableCell className="font-medium text-slate-100 text-xs sm:text-sm">
                                        <div className="flex items-center gap-2">
                                          <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500 flex-shrink-0" />
                                          <span className="truncate">{company.name}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-slate-300 text-xs sm:text-sm hidden lg:table-cell">
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-3 w-3 text-slate-500 flex-shrink-0" />
                                          <span>{company.phone}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-slate-300 text-xs sm:text-sm">
                                        <div className="flex flex-col gap-1">
                                          <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs w-fit">
                                            {company.apeCode}
                                          </Badge>
                                          <span className="text-xs text-slate-500">{getAPELabel(company.apeCode)}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-xs sm:text-sm">
                                        <div className="flex flex-col gap-1">
                                          {company.hasWebsite && company.site_web ? (
                                            <span className="text-emerald-400 text-lg sm:text-xl font-bold" title={company.site_web}>
                                              ✅
                                            </span>
                                          ) : (
                                            <span className="text-rose-400 text-lg sm:text-xl font-bold">❌</span>
                                          )}
                                          {company.site_web && (
                                            <a
                                              href={company.site_web}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-cyan-400 hover:text-cyan-300 underline truncate max-w-[150px]"
                                              title={company.site_web}
                                            >
                                              {company.site_web.replace(/^https?:\/\//, '').substring(0, 20)}...
                                            </a>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                                        {company.websiteAnalysis ? (
                                          <div className="flex flex-col gap-1">
                                            <Badge
                                              variant="outline"
                                              className={`text-xs w-fit ${
                                                company.websiteAnalysis.quality === 'excellent'
                                                  ? 'border-emerald-500 text-emerald-400'
                                                  : company.websiteAnalysis.quality === 'good'
                                                  ? 'border-cyan-500 text-cyan-400'
                                                  : company.websiteAnalysis.quality === 'poor'
                                                  ? 'border-orange-500 text-orange-400'
                                                  : 'border-rose-500 text-rose-400'
                                              }`}
                                            >
                                              {company.websiteAnalysis.quality === 'excellent'
                                                ? 'Excellent'
                                                : company.websiteAnalysis.quality === 'good'
                                                ? 'Bon'
                                                : company.websiteAnalysis.quality === 'poor'
                                                ? 'Médiocre'
                                                : 'Aucun'}
                                            </Badge>
                                            <span className="text-xs text-slate-500">
                                              Score: {company.websiteAnalysis.score}/100
                                            </span>
                                          </div>
                                        ) : company.hasWebsite ? (
                                          <Badge variant="outline" className="border-cyan-500 text-cyan-400 text-xs">
                                            Non analysé
                                          </Badge>
                                        ) : (
                                          <span className="text-slate-500 text-xs">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                                        {company.email ? (
                                          <div className="flex items-center gap-2">
                                            <Mail className="h-3 w-3 text-emerald-400" />
                                            <span className="text-emerald-400 truncate max-w-[200px]" title={company.email}>
                                              {company.email}
                                            </span>
                                            {company.emailSource === 'guessed' && (
                                              <span className="text-xs text-slate-500" title="Email probable (non vérifié)">
                                                ?
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-slate-500 text-xs">Non trouvé</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-xs sm:text-sm text-center">
                                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleEmailSent(company.id)}
                                            className={`p-2 ${
                                              emailsSent.has(company.id)
                                                ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/20'
                                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'
                                            }`}
                                            title={emailsSent.has(company.id) ? "Email envoyé - Cliquer pour retirer" : "Marquer comme email envoyé"}
                                          >
                                            {emailsSent.has(company.id) ? (
                                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                            ) : (
                                              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                                            )}
                                          </Button>
                                        </motion.div>
                                      </TableCell>
                                      <TableCell className="text-xs sm:text-sm">
                                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => generateProspectEmail(company)}
                                              disabled={isGeneratingEmail}
                                              className="text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 text-xs sm:text-sm p-1 sm:p-2"
                                              title="Générer un email de prospection"
                                            >
                                              {isGeneratingEmail ? (
                                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                              ) : (
                                                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                                              )}
                                              <span className="hidden sm:inline ml-1">Email</span>
                                            </Button>
                                          </motion.div>
                                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => toggleAddressVisibility(company.id)}
                                              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 text-xs sm:text-sm p-1 sm:p-2"
                                              title={visibleAddresses.has(company.id) ? "Masquer l'adresse" : "Voir l'adresse"}
                                            >
                                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                              <span className="hidden sm:inline ml-1">
                                                {visibleAddresses.has(company.id) ? 'Masquer' : 'Adresse'}
                                              </span>
                                            </Button>
                                          </motion.div>
                                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => openCompanyDetails(company)}
                                              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 text-xs sm:text-sm p-1 sm:p-2"
                                              title="Voir les détails"
                                            >
                                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                              <span className="hidden sm:inline ml-1">Fiche</span>
                                            </Button>
                                          </motion.div>
                                        </div>
                                      </TableCell>
                                    </motion.tr>
                                    {visibleAddresses.has(company.id) && (
                                      <motion.tr
                                        key={`${company.id}-address`}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-slate-800/20"
                                      >
                                        <TableCell colSpan={8} className="text-slate-300 text-xs sm:text-sm py-3 px-4">
                                          <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                              <span className="font-medium text-slate-200">Adresse :</span>
                                              <span className="ml-2">
                                                {company.address}, {company.postalCode} {company.city}
                                              </span>
                                            </div>
                                          </div>
                                        </TableCell>
                                      </motion.tr>
                                    )}
                                  </>
                                ))}
                              </AnimatePresence>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>

                    {/* Bouton "Charger plus" */}
                    {hasMorePages && (
                      <div className="flex justify-center pt-4">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            onClick={loadNextPage}
                            disabled={isLoadingPage}
                            variant="outline"
                            className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-300 transition-all duration-300"
                          >
                            {isLoadingPage ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Chargement...
                              </>
                            ) : (
                              <>
                                Charger plus de résultats (page {currentPage + 1})
                                <Download className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    )}

                    {/* Message de fin */}
                    {!hasMorePages && results.length > 0 && (
                      <div className="text-center py-4">
                        <p className="text-slate-400 text-sm">
                          Tous les résultats ont été chargés ({results.length} entreprise{results.length > 1 ? 's' : ''})
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Modale de détail */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full bg-slate-900 border-slate-800 text-slate-100 max-h-[90vh] overflow-y-auto">
          {selectedCompany && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-cyan-400 flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  {selectedCompany.name}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Détails complets de l'entreprise
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Adresse complète
                    </label>
                    <p className="text-slate-300">
                      {selectedCompany.address}<br />
                      {selectedCompany.postalCode} {selectedCompany.city}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Téléphone
                    </label>
                    <p className="text-slate-300">{selectedCompany.phone}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </label>
                    <p className="text-slate-300">
                      {selectedCompany.email || (
                        <span className="text-slate-500 italic">Non renseigné</span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Code APE
                    </label>
                    <Badge variant="outline" className="border-cyan-400/30 text-cyan-400">
                      {selectedCompany.apeCode}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Site web
                    </label>
                    {selectedCompany.hasWebsite && selectedCompany.site_web ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400">✅</span>
                          <a
                            href={selectedCompany.site_web}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
                          >
                            {selectedCompany.site_web}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {selectedCompany.websiteAnalysis && (
                          <div className="mt-2 p-3 bg-slate-800/50 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-300">Qualité :</span>
                              <Badge
                                variant="outline"
                                className={`${
                                  selectedCompany.websiteAnalysis.quality === 'excellent'
                                    ? 'border-emerald-500 text-emerald-400'
                                    : selectedCompany.websiteAnalysis.quality === 'good'
                                    ? 'border-cyan-500 text-cyan-400'
                                    : selectedCompany.websiteAnalysis.quality === 'poor'
                                    ? 'border-orange-500 text-orange-400'
                                    : 'border-rose-500 text-rose-400'
                                }`}
                              >
                                {selectedCompany.websiteAnalysis.quality === 'excellent'
                                  ? 'Excellent'
                                  : selectedCompany.websiteAnalysis.quality === 'good'
                                  ? 'Bon'
                                  : selectedCompany.websiteAnalysis.quality === 'poor'
                                  ? 'Médiocre'
                                  : 'Aucun'}
                              </Badge>
                              <span className="text-sm text-slate-400">
                                (Score: {selectedCompany.websiteAnalysis.score}/100)
                              </span>
                            </div>
                            {selectedCompany.websiteAnalysis.issues.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-400">Problèmes détectés :</span>
                                <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
                                  {selectedCompany.websiteAnalysis.issues.map((issue, idx) => (
                                    <li key={idx}>{issue}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="flex gap-4 text-xs text-slate-400">
                              <span>Mobile: {selectedCompany.websiteAnalysis.hasMobileVersion ? '✅' : '❌'}</span>
                              <span>Design moderne: {selectedCompany.websiteAnalysis.hasModernDesign ? '✅' : '❌'}</span>
                              {selectedCompany.websiteAnalysis.loadTime && (
                                <span>Temps de chargement: {selectedCompany.websiteAnalysis.loadTime}ms</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-rose-400">❌ Aucun site web</span>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Email de prospection
                      </label>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            generateProspectEmail(selectedCompany);
                            // Marquer automatiquement comme email envoyé après génération
                            setTimeout(() => {
                              if (!emailsSent.has(selectedCompany.id)) {
                                toggleEmailSent(selectedCompany.id);
                              }
                            }, 1000);
                          }}
                          disabled={isGeneratingEmail}
                          variant="outline"
                          className="border-purple-400/30 text-purple-400 hover:bg-purple-400/10"
                          size="sm"
                        >
                          {isGeneratingEmail ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Génération...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Générer un email
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => toggleEmailSent(selectedCompany.id)}
                          variant={emailsSent.has(selectedCompany.id) ? "default" : "outline"}
                          className={emailsSent.has(selectedCompany.id) 
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                            : "border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10"
                          }
                          size="sm"
                          title={emailsSent.has(selectedCompany.id) ? "Email envoyé - Cliquer pour retirer" : "Marquer comme email envoyé"}
                        >
                          {emailsSent.has(selectedCompany.id) ? (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Email envoyé
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Marquer envoyé
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Localisation
                    </label>
                    <a
                      href={getGoogleMapsUrl(selectedCompany)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
                    >
                      Voir sur Google Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modale d'email généré */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-3xl w-[95vw] sm:w-full bg-slate-900 border-slate-800 text-slate-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-purple-400 flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              Email de prospection généré
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Copiez cet email et personnalisez-le si nécessaire avant de l'envoyer
            </DialogDescription>
          </DialogHeader>
          {generatedEmail && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-cyan-400">Objet :</label>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-slate-100">{generatedEmail.subject}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-cyan-400">Corps du message :</label>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <pre className="text-slate-100 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {generatedEmail.body}
                  </pre>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={copyEmailToClipboard}
                  className="bg-purple-500 hover:bg-purple-600 text-white flex-1"
                >
                  {emailCopied ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copier l'email
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setIsEmailDialogOpen(false)}
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Fermer
                </Button>
              </div>
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-xs text-cyan-400 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Note :</strong> N'oubliez pas de remplacer "[Votre nom]" par votre nom réel avant d'envoyer l'email.
                    Vous pouvez également personnaliser le message selon vos besoins.
                  </span>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
