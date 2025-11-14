import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';

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



/**
 * Supprime un fichier uploadé s’il existe.
 * @param filePath - le nom du fichier à supprimer
 */
export function deleteUploadedFile(filePath: string): void {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Fichier supprimé : ${filePath}`);
    }
  } catch (error) {
    console.error(
      `⚠️ Erreur lors de la suppression du fichier : ${filePath}`,
      error,
    );
  }
}
