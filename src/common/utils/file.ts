import { Request } from 'express';

/**
 * Génère l'URL complète d'une image ou fichier
 * @param req - Request Express
 * @param filePath - chemin relatif stocké en DB (ex: /uploads/avatars/avatar.png)
 * @returns URL complète ou null si vide
 */
export const getFullUrl = (req: Request, filePath?: string): string | null => {
  if (!filePath) return null;
  return `${req.protocol}://${req.get('host')}${filePath}`;
};
