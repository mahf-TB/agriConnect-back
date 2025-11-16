import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { ConversationService } from '../conversation.service';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly conversationService: ConversationService,
  ) {}

  /**
   * Créer un message
   * L'expéditeur est forcé à l'utilisateur authentifié (sécurité)
   */
  @Post()
  async create(@Body() dto: CreateMessageDto, @Req() req: any) {
    const expediteurId = req.user?.id;
    if (!expediteurId) throw new BadRequestException('Utilisateur non authentifié');

    // Empêcher usurpation : forcer l'expediteur
    const payload = { ...dto, expediteurId };

    return this.messagesService.create(payload as any);
  }

  /**
   * Récupérer messages d'une conversation (option pagination via conversationService)
   */
  @Get('conversation/:conversationId')
  async findByConversation(
    @Param('conversationId') conversationId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');

    // Vérifier que l'utilisateur participe à la conversation
    const conv = await this.conversationService.findOne(conversationId);
    if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
      throw new ForbiddenException("Vous n'êtes pas participant de cette conversation");
    }

    if (page) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit || '20')));
      return this.conversationService.getMessagesWithPagination(conversationId, pageNum, limitNum);
    }

    return this.messagesService.findByConversation(conversationId);
  }

  /**
   * Récupérer messages directs entre deux utilisateurs
   */
  @Get('between/:otherUserId')
  async findBetweenUsers(@Param('otherUserId') otherUserId: string, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');
    return this.messagesService.findBetweenUsers(userId, otherUserId);
  }

  /**
   * Récupérer un message
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');

    const msg = await this.messagesService.findOne(id);
    // L'utilisateur doit être expéditeur ou destinataire
    if (msg.expediteurId !== userId && msg.destinataireId !== userId) {
      throw new ForbiddenException('Accès non autorisé au message');
    }
    return msg;
  }

  /**
   * Mettre à jour un message (seul l'expéditeur peut modifier)
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMessageDto, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');

    const msg = await this.messagesService.findOne(id);
    if (msg.expediteurId !== userId) {
      throw new ForbiddenException('Seul l\'expéditeur peut modifier le message');
    }

    return this.messagesService.update(id, dto);
  }

  /**
   * Marquer un message comme lu (seul destinataire)
   */
  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');

    const msg = await this.messagesService.findOne(id);
    if (msg.destinataireId !== userId) {
      throw new ForbiddenException('Seul le destinataire peut marquer comme lu');
    }

    return this.messagesService.markAsRead(id);
  }

  /**
   * Marquer tous les messages d'une conversation comme lus (utilisateur connecté)
   */
  @Post('conversation/:conversationId/read')
  async markConversationAsRead(@Param('conversationId') conversationId: string, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');

    // Vérifier participation
    const conv = await this.conversationService.findOne(conversationId);
    if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
      throw new ForbiddenException("Vous n'êtes pas participant de cette conversation");
    }

    return this.messagesService.markConversationAsRead(conversationId, userId);
  }

  /**
   * Supprimer un message (seul expéditeur ou admin)
   */
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');

    const msg = await this.messagesService.findOne(id);
    if (msg.expediteurId !== userId && role !== 'admin') {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres messages');
    }

    return this.messagesService.delete(id);
  }

  @Get('unread')
  async findUnread(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');
    return this.messagesService.findUnreadMessages(userId);
  }

  @Get('unread/count')
  async countUnread(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');
    return this.messagesService.countUnreadMessages(userId);
  }
}

