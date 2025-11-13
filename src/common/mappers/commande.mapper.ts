import { Commande, User } from 'generated/client';
import { CleanCommande, CollecteurInfo, Localisation } from '../types/commande.types';
import { capitalize } from '../utils/formatters';
import { getFullUrl } from '../utils/file';

// Commande avec le collecteur associé
export type CommandeWithCollecteur = Commande & { collecteur: User };

export const mapCommandeToClean = (
  commande: CommandeWithCollecteur,
  req?: any,
): CleanCommande => ({
  id: commande.id,
  produitRecherche: capitalize(commande.produitRecherche),
  quantiteTotal: Number(commande.quantiteTotal),
  unite: commande.unite,
  prixUnitaire: Number(commande.prixUnitaire),
  statut: commande.statut,
  messageCollecteur: commande.messageCollecteur ?? null,

  dateLivraisonPrevue: commande.dateLivraisonPrevue ?? null,
  dateLivraison: commande.dateLivraison ?? null,
  adresseLivraison: commande.adresseLivraison ?? null,

  createdAt: commande.createdAt,
  updatedAt: commande.updatedAt,

  localisation: commande.latitude && commande.longitude
    ? {
        territoire: commande.territoire ?? '',
        latitude: Number(commande.latitude),
        longitude: Number(commande.longitude),
        rayon: commande.rayon ? Number(commande.rayon) : undefined,
      }
    : undefined,

  collecteur: {
    id: commande.collecteur.id,
    nom: commande.collecteur.nom,
    prenom: commande.collecteur.prenom,
    email: commande.collecteur.email,
    telephone: commande.collecteur.telephone,
    role: commande.collecteur.role,
  },
});

export const mapCommandesToClean = (
  commandes: CommandeWithCollecteur[],
  req?: any,
): CleanCommande[] => commandes.map((cmd) => mapCommandeToClean(cmd, req));
