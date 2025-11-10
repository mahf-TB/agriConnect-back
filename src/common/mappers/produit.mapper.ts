import { Produit, User } from 'src/generated/client';
import { CleanProduit } from '../types/produit.types';
import { capitalize } from '../utils/formatters';

// Prisma retourne Produit + paysan (User)
export type ProduitWithPaysan = Produit & { paysan: User };

export const mapProduitToClean = (
  produit: ProduitWithPaysan,
): CleanProduit => ({
  id: produit.id,
  nom: capitalize(produit.nom),
  type: produit.type,
  sousType: produit.sousType,
  description: produit.description,
  quantiteDisponible: Number(produit.quantiteDisponible),
  unite: produit.unite,
  prixUnitaire: Number(produit.prixUnitaire),
  dateRecolte: produit.dateRecolte,
  datePeremption: produit.datePeremption,
  imageUrl: produit.imageUrl,
  statut: produit.statut,
  conditionsStockage: produit.conditionsStockage,
  createdAt: produit.createdAt,
  updatedAt: produit.updatedAt,

  localisation: {
    adresse: produit.localisation,
    latitude: Number(produit.latitude),
    longitude: Number(produit.longitude),
  },
  paysan: {
    id: produit.paysan.id,
    nom: produit.paysan.nom,
    prenom: produit.paysan.prenom,
    email: produit.paysan.email,
    telephone: produit.paysan.telephone,
    role: produit.paysan.role,
  },
});

export const mapProduitsToClean = (
  produits: ProduitWithPaysan[],
): CleanProduit[] => produits.map(mapProduitToClean);
