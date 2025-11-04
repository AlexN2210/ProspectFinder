// Catégories d'activités principales (codes APE) pour le filtrage
export interface APECategory {
  code: string;
  label: string;
  description: string;
}

export const APE_CATEGORIES: APECategory[] = [
  // Restauration
  { code: '5610A', label: 'Restauration', description: 'Restauration traditionnelle' },
  { code: '5610B', label: 'Restauration rapide', description: 'Restauration de type rapide' },
  { code: '5610C', label: 'Cafés', description: 'Cafés et bars' },
  
  // Commerce de détail
  { code: '4711D', label: 'Commerce alimentaire', description: 'Commerces de détail alimentaires sur éventaires et marchés' },
  { code: '4711F', label: 'Supermarchés', description: 'Supermarchés' },
  { code: '4722Z', label: 'Commerce de détail boucherie', description: 'Commerce de détail de viandes et de produits à base de viande en magasin spécialisé' },
  { code: '4773Z', label: 'Pharmacies', description: 'Commerce de détail de produits pharmaceutiques en magasin spécialisé' },
  { code: '4776Z', label: 'Fleuristes', description: 'Commerce de détail de fleurs, plantes, graines, engrais, animaux de compagnie et aliments pour ces animaux en magasin spécialisé' },
  
  // Services
  { code: '9602A', label: 'Coiffure', description: 'Salons de coiffure' },
  { code: '4520A', label: 'Garages automobiles', description: 'Entretien et réparation de véhicules automobiles légers' },
  { code: '4322A', label: 'Plomberie', description: 'Travaux de plomberie et installation sanitaire' },
  { code: '1623Z', label: 'Menuiserie', description: 'Menuiserie' },
  
  // Services professionnels
  { code: '6920Z', label: 'Cabinets comptables', description: 'Activités comptables' },
  { code: '7022Z', label: 'Conseil', description: 'Conseil pour les affaires et autres conseils de gestion' },
  
  // Artisanat
  { code: '1071C', label: 'Boulangerie', description: 'Boulangerie et boulangerie-pâtisserie' },
  { code: '1071D', label: 'Pâtisserie', description: 'Pâtisserie' },
  { code: '1623Z', label: 'Menuiserie', description: 'Menuiserie' },
  
  // Autres
  { code: '8559A', label: 'Formation', description: 'Formation continue d\'adultes' },
  { code: '8559B', label: 'Autres formations', description: 'Autres enseignements' },
];

// Fonction pour obtenir la catégorie d'un code APE
export function getAPECategory(apeCode: string): APECategory | undefined {
  return APE_CATEGORIES.find(cat => apeCode.startsWith(cat.code.substring(0, 4)));
}

// Fonction pour obtenir le label d'un code APE
export function getAPELabel(apeCode: string): string {
  const category = APE_CATEGORIES.find(cat => apeCode === cat.code || apeCode.startsWith(cat.code.substring(0, 4)));
  return category ? category.label : `Autre (${apeCode})`;
}

