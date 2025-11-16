import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  // Créer une notification pour 1 ou plusieurs utilisateurs
  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.envoieNotifyUsers(dto);
  }

  // Récupérer toutes les notifications d'un utilisateur
  @Get()
  findByUser(@Req() req: any) {
    const userId = req.user.id;
    return this.notificationService.findByUser(userId);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req) {
    const userId = req.user.id;
    return this.notificationService.getUnreadCount(userId);
  }
  @Get('unread')
  getNotifyUnread(@Req() req) {
    const userId = req.user.id;
    return this.notificationService.getNotifyUnread(userId);
  }

  // Marquer une notification comme lue
  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }
  @Patch('read-all')
  markAllAsRead() {
    // return this.notificationService.markAsRead(id);
  }
}
