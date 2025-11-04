import { useState } from 'react';
import { Search, Download, Building2, Loader2, MapPin, Phone, Globe, Mail, ExternalLink, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

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

  const handleSearch = async () => {
    if (!city && !apeCodeOrName) {
      setError('Veuillez remplir au moins un champ (Ville ou Code APE/Nom)');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setError(null);
    setResults([]);
    setScanProgress(0);

    try {
      // Appel à l'API pour rechercher de vraies entreprises
      const response = await fetch('/api/searchCompanies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          city: city,
          apeCodeOrName: apeCodeOrName || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }

      // Transformer les résultats en format Company avec hasWebsite initialisé à false
      let filteredResults: Company[] = (data.companies || []).map((company: any) => ({
        ...company,
        hasWebsite: false, // Sera mis à jour lors du scan
        site_web: '',
      }));

      console.log('Recherche effectuée:', { city, apeCodeOrName, resultsCount: filteredResults.length });

      // Si aucune entreprise trouvée, afficher un message
      if (filteredResults.length === 0) {
        setError('Aucune entreprise trouvée pour ces critères');
        setIsLoading(false);
        return;
      }

      // Afficher d'abord les résultats sans vérification de site web
      setResults(filteredResults);
      setIsLoading(false);

      // Ensuite, scanner chaque entreprise pour vérifier le site web
      if (filteredResults.length > 0) {
        setIsScanning(true);
        setScanProgress(0);

        try {
          const updatedResults = await Promise.all(
            filteredResults.map(async (company, index) => {
              const websiteCheck = await checkWebsite(company);
              setScanProgress(((index + 1) / filteredResults.length) * 100);

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
          // En cas d'erreur, garder les résultats avec les données existantes
          setResults(filteredResults);
        } finally {
          setIsScanning(false);
          setScanProgress(100);
        }
      } else {
        // Aucun résultat, arrêter le loading
        setIsLoading(false);
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la recherche');
      setIsLoading(false);
      setIsScanning(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Nom', 'Adresse', 'Code Postal', 'Ville', 'Téléphone', 'Email', 'Site Web', 'Code APE'];
    const csvContent = [
      headers.join(','),
      ...results.map(company =>
        [
          `"${company.name}"`,
          `"${company.address}"`,
          `"${company.postalCode}"`,
          `"${company.city}"`,
          `"${company.phone}"`,
          `"${company.email || ''}"`,
          `"${company.site_web || ''}"`,
          company.apeCode
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
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-400" />
                    Ville
                  </label>
                  <Input
                    placeholder="ex: Paris, Lyon, Reims..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20 transition-all text-sm sm:text-base"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
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
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {results.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <Building2 className="h-16 w-16 mx-auto text-slate-700" />
                    <p className="text-slate-400 text-lg">Aucune entreprise trouvée</p>
                    <p className="text-slate-500 text-sm">Essayez d'élargir vos critères de recherche</p>
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
                                <TableHead className="text-cyan-400 font-semibold text-xs sm:text-sm hidden md:table-cell">Adresse</TableHead>
                                <TableHead className="text-cyan-400 font-semibold text-xs sm:text-sm hidden lg:table-cell">Téléphone</TableHead>
                                <TableHead className="text-cyan-400 font-semibold text-xs sm:text-sm">Code APE</TableHead>
                                <TableHead className="text-cyan-400 font-semibold text-xs sm:text-sm">Site web</TableHead>
                                <TableHead className="text-cyan-400 font-semibold text-xs sm:text-sm">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <AnimatePresence>
                                {results.map((company, index) => (
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
                                    <TableCell className="text-slate-300 text-xs sm:text-sm hidden md:table-cell">
                                      <span className="truncate block">{company.address}, {company.postalCode} {company.city}</span>
                                    </TableCell>
                                    <TableCell className="text-slate-300 text-xs sm:text-sm hidden lg:table-cell">
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-3 w-3 text-slate-500 flex-shrink-0" />
                                        <span>{company.phone}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-slate-300 text-xs sm:text-sm">
                                      <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                                        {company.apeCode}
                                      </Badge>
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
                                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => openCompanyDetails(company)}
                                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 text-xs sm:text-sm"
                                        >
                                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                                          <span className="hidden sm:inline">Voir fiche</span>
                                        </Button>
                                      </motion.div>
                                    </TableCell>
                                  </motion.tr>
                                ))}
                              </AnimatePresence>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
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
