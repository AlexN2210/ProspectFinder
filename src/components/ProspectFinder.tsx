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

const mockCompanies: Company[] = [
  { 
    id: '1', 
    name: 'Boulangerie Dupont', 
    address: '12 Rue de la Paix', 
    city: 'Paris', 
    postalCode: '75001',
    phone: '01 42 86 42 86', 
    email: 'contact@boulangeriedupont.fr',
    site_web: '',
    hasWebsite: false, 
    apeCode: '1071C',
    latitude: 48.8566,
    longitude: 2.3522
  },
  { 
    id: '2', 
    name: 'Plomberie Martin', 
    address: '8 Avenue Victor Hugo', 
    city: 'Lyon', 
    postalCode: '69001',
    phone: '04 78 90 12 34', 
    email: 'info@plomberiemartin.fr',
    site_web: 'https://www.plomberiemartin.fr',
    hasWebsite: true, 
    apeCode: '4322A',
    latitude: 45.7640,
    longitude: 4.8357
  },
  { 
    id: '3', 
    name: 'Salon Coiffure Élégance', 
    address: '25 Boulevard Gambetta', 
    city: 'Marseille', 
    postalCode: '13001',
    phone: '04 91 55 67 89', 
    email: 'contact@salon-elegance.fr',
    site_web: 'https://www.salon-elegance.fr',
    hasWebsite: true, 
    apeCode: '9602A',
    latitude: 43.2965,
    longitude: 5.3698
  },
  { 
    id: '4', 
    name: 'Restaurant Le Gourmet', 
    address: '34 Rue du Commerce', 
    city: 'Toulouse', 
    postalCode: '31000',
    phone: '05 61 22 33 44', 
    email: 'reservation@legourmet.fr',
    site_web: '',
    hasWebsite: false, 
    apeCode: '5610A',
    latitude: 43.6047,
    longitude: 1.4442
  },
  { 
    id: '5', 
    name: 'Garage Auto Service', 
    address: '15 Rue de la République', 
    city: 'Nice', 
    postalCode: '06000',
    phone: '04 93 88 99 00', 
    email: 'contact@garage-autoservice.fr',
    site_web: '',
    hasWebsite: false, 
    apeCode: '4520A',
    latitude: 43.7102,
    longitude: 7.2620
  },
  { 
    id: '6', 
    name: 'Pharmacie de la Place', 
    address: '7 Place de la Mairie', 
    city: 'Nantes', 
    postalCode: '44000',
    phone: '02 40 11 22 33', 
    email: 'pharmacie@pharmacie-place.fr',
    site_web: 'https://www.pharmacie-place.fr',
    hasWebsite: true, 
    apeCode: '4773Z',
    latitude: 47.2184,
    longitude: -1.5536
  },
  { 
    id: '7', 
    name: 'Menuiserie Artisanale', 
    address: '19 Chemin des Acacias', 
    city: 'Strasbourg', 
    postalCode: '67000',
    phone: '03 88 44 55 66', 
    email: 'info@menuiserie-artisanale.fr',
    site_web: '',
    hasWebsite: false, 
    apeCode: '1623Z',
    latitude: 48.5734,
    longitude: 7.7521
  },
  { 
    id: '8', 
    name: 'Fleuriste La Rose', 
    address: '3 Rue des Fleurs', 
    city: 'Bordeaux', 
    postalCode: '33000',
    phone: '05 56 77 88 99', 
    email: 'contact@fleuriste-larose.fr',
    site_web: '',
    hasWebsite: false, 
    apeCode: '4776Z',
    latitude: 44.8378,
    longitude: -0.5792
  },
  { 
    id: '9', 
    name: 'Cabinet Comptable Experts', 
    address: '42 Avenue Foch', 
    city: 'Lille', 
    postalCode: '59000',
    phone: '03 20 99 00 11', 
    email: 'contact@cabinet-experts.fr',
    site_web: 'https://www.cabinet-experts.fr',
    hasWebsite: true, 
    apeCode: '6920Z',
    latitude: 50.6292,
    longitude: 3.0573
  },
  { 
    id: '10', 
    name: 'Boucherie Traditionnelle', 
    address: '9 Rue du Marché', 
    city: 'Rennes', 
    postalCode: '35000',
    phone: '02 99 22 33 44', 
    email: 'contact@boucherie-traditionnelle.fr',
    site_web: '',
    hasWebsite: false, 
    apeCode: '4722Z',
    latitude: 48.1173,
    longitude: -1.6778
  },
];

export default function ProspectFinder() {
  const [city, setCity] = useState('');
  const [apeCode, setApeCode] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    setError(null);

    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1500));

      const filteredResults = mockCompanies.filter(company => {
        const cityMatch = !city || company.city.toLowerCase().includes(city.toLowerCase());
        const apeMatch = !apeCode || company.apeCode.includes(apeCode);
        return cityMatch && apeMatch;
      });

      setResults(filteredResults);
    } catch (err) {
      setError('Une erreur est survenue lors de la recherche');
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-4 pt-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Building2 className="h-12 w-12 text-cyan-400 animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              ProspectFinder
            </h1>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
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
                Affinez votre recherche par ville et code APE
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    Ville
                  </label>
                  <Input
                    placeholder="ex: Paris, Lyon, Reims..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-400" />
                    Code APE
                  </label>
                  <Input
                    placeholder="ex: 5610A, 1071C..."
                    value={apeCode}
                    onChange={(e) => setApeCode(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>

                <div className="flex items-end">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleSearch}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-300"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Recherche...
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-slate-800 bg-slate-800/30">
                        <CardContent className="pt-6">
                          <div className="text-center space-y-2">
                            <p className="text-slate-400 text-sm">Total d'entreprises</p>
                            <p className="text-3xl font-bold text-cyan-400">{totalCompanies}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-800 bg-slate-800/30">
                        <CardContent className="pt-6">
                          <div className="text-center space-y-2">
                            <p className="text-slate-400 text-sm">Sans site web</p>
                            <p className="text-3xl font-bold text-rose-400">{companiesWithoutWebsite}</p>
                            <p className="text-xs text-slate-500">{percentageWithoutWebsite}%</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-800 bg-slate-800/30">
                        <CardContent className="pt-6">
                          <div className="text-center space-y-2">
                            <p className="text-slate-400 text-sm">Avec site web</p>
                            <p className="text-3xl font-bold text-emerald-400">{companiesWithWebsite}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Graphique */}
                    {totalCompanies > 0 && (
                      <Card className="border-slate-800 bg-slate-800/30">
                        <CardHeader>
                          <CardTitle className="text-lg text-slate-100">Répartition avec/sans site web</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer config={chartConfig} className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={chartData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={100}
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
                    <div className="rounded-lg border border-slate-800 overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
                              <TableHead className="text-cyan-400 font-semibold">Nom de l'entreprise</TableHead>
                              <TableHead className="text-cyan-400 font-semibold">Adresse</TableHead>
                              <TableHead className="text-cyan-400 font-semibold">Téléphone</TableHead>
                              <TableHead className="text-cyan-400 font-semibold">Code APE</TableHead>
                              <TableHead className="text-cyan-400 font-semibold">Site web</TableHead>
                              <TableHead className="text-cyan-400 font-semibold">Actions</TableHead>
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
                                  <TableCell className="font-medium text-slate-100">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-slate-500" />
                                      {company.name}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-slate-300">
                                    {company.address}, {company.postalCode} {company.city}
                                  </TableCell>
                                  <TableCell className="text-slate-300">
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-3 w-3 text-slate-500" />
                                      {company.phone}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-slate-300">
                                    <Badge variant="outline" className="border-slate-700 text-slate-400">
                                      {company.apeCode}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {company.hasWebsite && company.site_web ? (
                                      <span className="text-emerald-400 text-xl font-bold" title={company.site_web}>
                                        ✅
                                      </span>
                                    ) : (
                                      <span className="text-rose-400 text-xl font-bold">❌</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openCompanyDetails(company)}
                                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                                      >
                                        <Eye className="mr-2 h-4 w-4" />
                                        Voir fiche
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
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Modale de détail */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-100">
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
