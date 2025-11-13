import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  // Créer une notification pour 1 ou plusieurs utilisateurs
  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  // Récupérer toutes les notifications d'un utilisateur
  @Get('user/:id')
  findByUser(@Param('id') id: string) {
    return this.notificationService.findByUser(id);
  }


  // Marquer une notification comme lue
  @Patch(':id/lu')
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }
}
