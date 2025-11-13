import { CommandeStatut, Role, Unite } from 'generated/enums';

export type Localisation = {
  territoire?: string;
  latitude?: number;
  longitude?: number;
  rayon?: number;
};

export type CollecteurInfo = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: Role;
};

export type CleanCommande = {
  id: string;
  produitRecherche: string;
  quantiteTotal: number;
  unite: Unite;
  prixUnitaire: number;
  statut: CommandeStatut;
  messageCollecteur: string | null;

  dateLivraisonPrevue: Date | null;
  dateLivraison: Date | null;
  adresseLivraison: string | null;

  createdAt: Date;
  updatedAt: Date;
  
  localisation?: Localisation;
  collecteur: CollecteurInfo;
};

// Structure pour pagination propre
export type PaginatedCommandes = {
  data: CleanCommande[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
