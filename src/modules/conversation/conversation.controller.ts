import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  async create(@Body() dto: CreateConversationDto) {
    return this.conversationService.create(dto);
  }

  @Post('find-or-create')
  async findOrCreate(@Body() dto: CreateConversationDto) {
    return this.conversationService.findOrCreate(dto.participant1Id, dto.participant2Id);
  }

  @Get()
  async findByUser(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');
    return this.conversationService.findByUserId(userId);
  }

  @Get('archived')
  async findArchived(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');
    return this.conversationService.findArchivedByUserId(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const conv = await this.conversationService.findOne(id);
    const userId = req.user?.id;
    // Vérifier que l'utilisateur est participant
    if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
      throw new BadRequestException("Vous n'êtes pas participant de cette conversation");
    }
    return conv;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateConversationDto, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');
    return this.conversationService.update(id, dto, userId);
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');
    return this.conversationService.archive(id, userId);
  }

  @Post(':id/reset-unread')
  async resetUnread(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');
    return this.conversationService.resetUnreadCount(id, userId);
  }

  @Post(':id/increment-unread')
  async incrementUnread(@Param('id') id: string, @Body() body: any) {
    const destinataireId = body?.destinataireId;
    if (!destinataireId) throw new BadRequestException('destinataireId requis');
    return this.conversationService.incrementUnreadCount(id, destinataireId);
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 20));
    return this.conversationService.getMessagesWithPagination(id, pageNum, limitNum);
  }
}

