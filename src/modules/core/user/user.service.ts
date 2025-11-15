import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { hashPassword } from 'src/common/utils/password.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { deleteUploadedFile, getFullUrl } from 'src/common/utils/file';
import { Request } from 'express';

/**
 * Service gérant les utilisateurs
 * Responsabilités:
 * - CRUD utilisateurs
 * - Gestion des avatars (upload/suppression)
 * - Hachage des mots de passe
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,

  ) {}

  /**
   * Crée un nouvel utilisateur
   * @param data Données du nouvel utilisateur
   * @returns Utilisateur créé (sans mot de passe)
   */
  async create(data: CreateUserDto) {
    this.logger.debug(`Création utilisateur: ${data.email}`);
    
    try {
      const hashedPassword = await hashPassword(data.mot_de_passe);
      const user = await this.prisma.user.create({
        data: {
          ...data,
          mot_de_passe: hashedPassword,
        },
      });

      return this.sanitizeUser(user);
    } catch (error) {
      this.logger.error(`Erreur création utilisateur: ${error.message}`, error.stack);
      throw new BadRequestException('Erreur lors de la création de l\'utilisateur');
    }
  }

  /**
   * Récupère tous les utilisateurs
   * @returns Liste des utilisateurs sans mots de passe
   */
  async findAll(req :Request) {
    this.logger.debug('Récupération de tous les utilisateurs');
    
    const users = await this.prisma.user.findMany();

     const userSani = this.sanitizeUser(users);
     return {...userSani, avatar : getFullUrl(req, userSani.avatar)}
  }

  /**
   * Récupère un utilisateur par ID
   * @param id ID de l'utilisateur
   * @returns Utilisateur sans mot de passe
   */
  async findOne(id: string) {
    this.logger.debug(`Récupération utilisateur: ${id}`);
    
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  /**
   * Récupère un utilisateur par email (utilisé par auth)
   * @param email Email de l'utilisateur
   * @returns Utilisateur avec mot de passe (pour validation)
   */
  async findByEmail(email: string) {
    this.logger.debug(`Recherche utilisateur par email: ${email}`);
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Met à jour les infos d'un utilisateur
   * @param id ID de l'utilisateur
   * @param data Données à mettre à jour
   * @returns Utilisateur mis à jour
   */
  async update(id: string, data: UpdateUserDto) {
    this.logger.debug(`Mise à jour utilisateur: ${id}`);
    
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
      });

      return this.sanitizeUser(user);
    } catch (error) {
      this.logger.error(`Erreur mise à jour utilisateur: ${error.message}`, error.stack);
      throw new BadRequestException('Erreur lors de la mise à jour de l\'utilisateur');
    }
  }

  /**
   * Supprime un utilisateur
   * Supprime aussi son avatar s'il existe
   * @param id ID de l'utilisateur
   * @returns Utilisateur supprimé
   */
  async remove(id: string) {
    this.logger.debug(`Suppression utilisateur: ${id}`);
    
    try {
      // Récupérer l'utilisateur pour obtenir l'avatar
      const user = await this.prisma.user.findUnique({ where: { id } });
      
      if (user?.avatar) {
        await deleteUploadedFile(user.avatar);
      }

      return await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Erreur suppression utilisateur: ${error.message}`, error.stack);
      throw new BadRequestException('Erreur lors de la suppression de l\'utilisateur');
    }
  }

  /**
   * Met à jour l'avatar d'un utilisateur
   * Supprime l'ancien avatar avant d'assigner le nouveau
   * @param userId ID de l'utilisateur
   * @param newAvatarPath Chemin du nouvel avatar (ex: '/uploads/avatars/file.jpg')
   * @returns Utilisateur mis à jour
   */
  async updateAvatar(userId: string, newAvatarPath: string): Promise<any> {
    this.logger.debug(`Mise à jour avatar utilisateur: ${userId}`);
    
    try {
      // Récupérer l'utilisateur pour obtenir l'ancien avatar
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      
      if (!user) {
        throw new BadRequestException('Utilisateur non trouvé');
      }

      // Supprimer l'ancien avatar s'il existe
      if (user.avatar) {
         deleteUploadedFile(user.avatar);
      }

      // Mettre à jour avec le nouveau chemin
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { avatar: newAvatarPath },
      });

      this.logger.log(`Avatar mis à jour pour utilisateur: ${userId}`);
      return this.sanitizeUser(updatedUser);
    } catch (error) {
      this.logger.error(`Erreur mise à jour avatar: ${error.message}`, error.stack);
      throw new BadRequestException('Erreur lors de la mise à jour de l\'avatar');
    }
  }

  /**
   * Supprime l'avatar d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Utilisateur mis à jour
   */
  async removeAvatar(userId: string): Promise<any> {
    this.logger.debug(`Suppression avatar utilisateur: ${userId}`);
    
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      
      if (!user) {
        throw new BadRequestException('Utilisateur non trouvé');
      }

      // Supprimer le fichier
      if (user.avatar) {
        await deleteUploadedFile(user.avatar);
      }

      // Mettre à jour le champ avatar à null
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { avatar: null },
      });

      this.logger.log(`Avatar supprimé pour utilisateur: ${userId}`);
      return this.sanitizeUser(updatedUser);
    } catch (error) {
      this.logger.error(`Erreur suppression avatar: ${error.message}`, error.stack);
      throw new BadRequestException('Erreur lors de la suppression de l\'avatar');
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Nettoie les données sensibles d'un utilisateur
   * Enlève le mot de passe
   * @param user Utilisateur à nettoyer
   * @returns Utilisateur sans mot de passe
   */
  private sanitizeUser(user: any) {
    const { mot_de_passe, ...rest } = user;
    return rest;
  }
}
