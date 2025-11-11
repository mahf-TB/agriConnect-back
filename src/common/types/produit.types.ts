import { Role } from "generated/enums";

export type Localisation = {
  adresse?: string;
  latitude?: number;
  longitude?: number;
};

export type PaysanInfo = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: Role;
};

export type CleanProduit = {
  id: string;
  nom: string;
  type: string;
  sousType: string | null;
  description: string | null;
  quantiteDisponible: number;
  unite: string;
  prixUnitaire: number;
  dateRecolte: Date;
  datePeremption: Date | null;
  imageUrl: string | null;
  statut: string;
  conditionsStockage: string | null;
  createdAt: Date;
  updatedAt: Date;
  localisation?: Localisation;
  paysan: PaysanInfo;
};

// Structure pour pagination propre
export type PaginatedProduits = {
  data: CleanProduit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
