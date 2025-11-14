import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileUploadInterceptor } from 'src/common/interceptors/file-upload.interceptor';

/**
 * Contrôleur pour la gestion des utilisateurs
 * Routes:
 * - POST /user (création)
 * - GET /user (liste tous)
 * - GET /user/:id (détails)
 * - PUT /user/:id (mise à jour)
 * - DELETE /user/:id (suppression)
 * - POST /user/avatar (upload avatar)
 * - DELETE /user/:id/avatar (suppression avatar)
 */
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  /**
   * Crée un nouvel utilisateur
   */
  @Post()
  async create(@Body() dto: CreateUserDto) {
    this.logger.debug(`Création utilisateur: ${dto.email}`);
    return this.userService.create(dto);
  }

  /**
   * Récupère tous les utilisateurs
   */
  @Get()
  async findAll(@Request() req: any) {
    this.logger.debug('Récupération tous les utilisateurs');
    return this.userService.findAll(req);
  }

  /**
   * Récupère un utilisateur spécifique
   */
  @Get(':id')
  async findUser(@Param('id') id: string) {
    this.logger.debug(`Récupération utilisateur: ${id}`);
    const user = await this.userService.findOne(id);

    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    return user;
  }

  /**
   * Met à jour les infos d'un utilisateur
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req: any) {
    const userId = req.user.id;
    this.logger.debug(`Mise à jour utilisateur: ${userId}`);
    return this.userService.update(userId, dto);
  }

  /**
   * Supprime un utilisateur
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    this.logger.debug(`Suppression utilisateur: ${id}`);
    return this.userService.remove(id);
  }

  /**
   * Upload ou met à jour l'avatar d'un utilisateur
   * Si l'utilisateur a déjà un avatar, l'ancien est supprimé
   *
   * Route: POST /user/avatar
   * Body: FormData avec clé 'avatar' (fichier)
   */
  @Post('avatar')
  @UseInterceptors(FileUploadInterceptor('avatar', 'avatars'))
  async uploadAvatar(@UploadedFile() file: any, @Req() req: any) {
    const userId = req.user?.id;

    if (!userId) {
      this.logger.error('Tentative upload avatar sans utilisateur authentifié');
      throw new BadRequestException('Utilisateur non authentifié');
    }

    if (!file?.filename) {
      this.logger.warn(`Upload avatar échoué pour utilisateur: ${userId}`);
      throw new BadRequestException('Erreur lors du téléchargement du fichier');
    }

    this.logger.log(
      `Upload avatar pour utilisateur: ${userId}, fichier: ${file.filename}`,
    );

    // Construire le chemin d'upload
    const avatarUrl = `/uploads/avatars/${file.filename}`;

    // Mettre à jour l'avatar (ancien sera supprimé automatiquement)
    return this.userService.updateAvatar(userId, avatarUrl);
  }

  /**
   * Supprime l'avatar d'un utilisateur
   *
   * Route: DELETE /user/:id/avatar
   */
  @Delete(':id/avatar')
  async removeAvatar(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;

    // Vérifier que l'utilisateur supprime son propre avatar ou qu'il est admin
    if (userId !== id && req.user?.role !== 'admin') {
      throw new BadRequestException(
        'Vous ne pouvez supprimer que votre propre avatar',
      );
    }

    this.logger.log(`Suppression avatar pour utilisateur: ${id}`);
    return this.userService.removeAvatar(id);
  }
}
