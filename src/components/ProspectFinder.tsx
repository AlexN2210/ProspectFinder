import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Download, Building2, Loader2, MapPin, Phone, Globe, Mail, ExternalLink, Eye, Filter, X } from 'lucide-react';
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
  
  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  
  // État pour le filtrage par catégories APE
  const [selectedAPECategories, setSelectedAPECategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'ape' | 'website'>('name');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
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
                setScanProgress(((index + 1) / newResults.length) * 100);

                return {
                  ...company,
                  hasWebsite: websiteCheck.hasWebsite,
                  site_web: websiteCheck.website || company.site_web || '',
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

  const loadNextPage = async () => {
    if (hasMorePages && !isLoadingPage) {
      await loadPage(currentPage + 1, false);
    }
  };

  // Toggle d'une catégorie APE
  const toggleAPECategory = (categoryCode: string) => {
    setSelectedAPECategories(prev => 
      prev.includes(categoryCode)
        ? prev.filter(code => code !== categoryCode)
        : [...prev, categoryCode]
    );
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSelectedAPECategories([]);
    setSortBy('name');
  };

  // Calcul des résultats filtrés et triés
  const filteredAndSortedResults = useMemo(() => {
    let filtered = [...results];

    // Filtrer par catégories APE si des catégories sont sélectionnées
    if (selectedAPECategories.length > 0) {
      filtered = filtered.filter(company => {
        // Ignorer les entreprises sans code APE si on filtre
        if (!company.apeCode || company.apeCode.trim() === '') {
          return false;
        }
        
        // Normaliser le code APE de l'entreprise (enlever les points, espaces, mettre en majuscule)
        const companyApeCode = company.apeCode
          .toUpperCase()
          .replace(/\./g, '') // Enlever les points (ex: 56.10A -> 5610A)
          .replace(/\s/g, '') // Enlever les espaces
          .trim();
        
        return selectedAPECategories.some(categoryCode => {
          // Normaliser le code de catégorie
          const categoryApeCode = categoryCode
            .toUpperCase()
            .replace(/\./g, '')
            .replace(/\s/g, '')
            .trim();
          
          // Comparaison exacte (ex: 5610A === 5610A)
          if (companyApeCode === categoryApeCode) {
            return true;
          }
          
          // Comparaison par les 4 premiers caractères (code principal)
          // Cela permet de matcher 5610A, 5610B, 5610C avec la catégorie 5610A
          if (companyApeCode.length >= 4 && categoryApeCode.length >= 4) {
            const companyPrefix = companyApeCode.substring(0, 4);
            const categoryPrefix = categoryApeCode.substring(0, 4);
            
            // Si les 4 premiers caractères correspondent (ex: 5610)
            if (companyPrefix === categoryPrefix) {
              return true;
            }
          }
          
          // Comparaison si le code APE de l'entreprise commence par le code de catégorie complet
          // (pour des cas spéciaux où on veut matcher une sous-catégorie)
          if (companyApeCode.startsWith(categoryApeCode)) {
            return true;
          }
          
          return false;
        });
      });
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
  }, [results, selectedAPECategories, sortBy]);

  const exportToCSV = () => {
    const headers = ['Nom', 'Adresse', 'Code Postal', 'Ville', 'Téléphone', 'Email', 'Site Web', 'Code APE', 'Catégorie'];
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
          `"${company.site_web || ''}"`,
          company.apeCode,
          `"${getAPELabel(company.apeCode)}"`
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
                        {(selectedAPECategories.length > 0 || sortBy !== 'name') && (
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

                      {/* Filtres par catégories APE */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Filtrer par catégorie</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border border-slate-700 rounded-lg">
                          {APE_CATEGORIES.map((category) => (
                            <div key={category.code} className="flex items-center space-x-2">
                              <Checkbox
                                id={`ape-${category.code}`}
                                checked={selectedAPECategories.includes(category.code)}
                                onCheckedChange={() => toggleAPECategory(category.code)}
                                className="border-slate-600"
                              />
                              <label
                                htmlFor={`ape-${category.code}`}
                                className="text-sm text-slate-300 cursor-pointer flex-1"
                              >
                                <div className="font-medium">{category.label}</div>
                                <div className="text-xs text-slate-500">{category.code}</div>
                              </label>
                            </div>
                          ))}
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
                                        {company.hasWebsite && company.site_web ? (
                                          <span className="text-emerald-400 text-lg sm:text-xl font-bold" title={company.site_web}>
                                            ✅
                                          </span>
                                        ) : (
                                          <span className="text-rose-400 text-lg sm:text-xl font-bold">❌</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-xs sm:text-sm">
                                        <div className="flex items-center gap-1 sm:gap-2">
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
                                        <TableCell colSpan={5} className="text-slate-300 text-xs sm:text-sm py-3 px-4">
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
                    ) : (
                      <span className="text-rose-400">❌ Aucun site web</span>
                    )}
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
    </div>
  );
}
