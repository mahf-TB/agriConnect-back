import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
// import { NotificationGateway } from './notification.gateway';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsGateway } from 'src/common/websockets/notifications/notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

    // 🔔 Créer une notification pour 1 ou N utilisateurs et envoyer en temps réel
  async envoieNotifyUsers(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        type: dto.type,
        titre: dto.titre,
        message: dto.message,
        lien: dto.lien,
        reference_id: dto.reference_id,
        reference_type: dto.reference_type,
        allUserNotifications: {
          create: dto.userIds.map((userId) => ({
            user: { connect: { id: userId } },
          })),
        },
      },
      include: { allUserNotifications: true },
    });
    const { allUserNotifications, ...notifData } = notification;
    // Envoi temps réel
    this.gateway.sendNotificationToUsers(dto.userIds, notifData);
    return notification;
  }



  async envoieNotifyOneUser(dto: Partial<CreateNotificationDto> & {userId: string}) {
    
    const  notification = await this.prisma.notification.create({
        data: {
          type: dto.type,
          titre: dto.titre,
          message: dto.message,
          lien: dto.lien,
          reference_id: dto.reference_id,
          reference_type: dto.reference_type,
          allUserNotifications: {
            create: {
              user: { connect: { id: dto.userId } },
            },
          },
        },
        include: { allUserNotifications: true },
      });
    
    const { allUserNotifications, ...notifData } = notification;
    // Envoi temps réel
    this.gateway.sendNotificationToUser(dto.userId, notifData);
    return notification;
  }


  // 📜 Liste des notifications pour un utilisateur
  async findByUser(userId: string) {
    return this.prisma.userNotification.findMany({
      where: { userId },
      include: { notification: true },
      orderBy: { notification: { createdAt: 'desc' } },
    });
  }

  // ✅ Marquer une notification comme lue
  async markAsRead(userNotificationId: string) {
    return this.prisma.userNotification.update({
      where: { id: userNotificationId },
      data: { lu: true, dateLecture: new Date() },
    });
  }
}
