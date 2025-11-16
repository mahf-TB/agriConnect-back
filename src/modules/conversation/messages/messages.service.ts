import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un nouveau message
   */
  async create(dto: CreateMessageDto) {
    try {
      // Vérifier que l'expéditeur et le destinataire existent
      const [expediteur, destinataire] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: dto.expediteurId } }),
        this.prisma.user.findUnique({ where: { id: dto.destinataireId } }),
      ]);

      if (!expediteur || !destinataire) {
        throw new BadRequestException(
          'Expéditeur ou destinataire non trouvé',
        );
      }

      const message = await this.prisma.message.create({
        data: {
          expediteurId: dto.expediteurId,
          destinataireId: dto.destinataireId,
          contenu: dto.contenu || null,
          typeContenu: dto.typeContenu || 'texte',
          fichierUrl: dto.fichierUrl || null,
          conversationId: dto.conversationId || null,
        },
        include: {
          expediteur: true,
          destinataire: true,
          conversation: true,
        },
      });

      return message;
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la création du message : ${error.message}`,
      );
    }
  }

  /**
   * Récupérer tous les messages d'une conversation
   */
  async findByConversation(conversationId: string) {
    try {
      const messages = await this.prisma.message.findMany({
        where: { conversationId },
        include: {
          expediteur: true,
          destinataire: true,
        },
        orderBy: {
          dateEnvoi: 'asc',
        },
      });

      return messages;
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la récupération des messages : ${error.message}`,
      );
    }
  }

  /**
   * Récupérer les messages entre deux utilisateurs (direct)
   */
  async findBetweenUsers(userId1: string, userId2: string) {
    try {
      const messages = await this.prisma.message.findMany({
        where: {
          OR: [
            {
              expediteurId: userId1,
              destinataireId: userId2,
            },
            {
              expediteurId: userId2,
              destinataireId: userId1,
            },
          ],
          conversationId: null, // Messages directs sans conversation
        },
        include: {
          expediteur: true,
          destinataire: true,
        },
        orderBy: {
          dateEnvoi: 'desc',
        },
      });

      return messages;
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la récupération des messages : ${error.message}`,
      );
    }
  }

  /**
   * Récupérer un message par ID
   */
  async findOne(id: string) {
    try {
      const message = await this.prisma.message.findUnique({
        where: { id },
        include: {
          expediteur: true,
          destinataire: true,
          conversation: true,
        },
      });

      if (!message) {
        throw new NotFoundException('Message non trouvé');
      }

      return message;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Erreur lors de la récupération du message : ${error.message}`,
      );
    }
  }

  /**
   * Mettre à jour un message
   */
  async update(id: string, dto: UpdateMessageDto) {
    try {
      const message = await this.findOne(id);

      const updatedMessage = await this.prisma.message.update({
        where: { id },
        data: {
          contenu: dto.contenu !== undefined ? dto.contenu : message.contenu,
          typeContenu:
            dto.typeContenu !== undefined ? dto.typeContenu : message.typeContenu,
          fichierUrl:
            dto.fichierUrl !== undefined ? dto.fichierUrl : message.fichierUrl,
          lu: dto.lu !== undefined ? dto.lu : message.lu,
        },
        include: {
          expediteur: true,
          destinataire: true,
          conversation: true,
        },
      });

      return updatedMessage;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Erreur lors de la mise à jour du message : ${error.message}`,
      );
    }
  }

  /**
   * Marquer un message comme lu
   */
  async markAsRead(id: string) {
    try {
      const message = await this.update(id, {
        lu: true,
      });

      return message;
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors du marquage du message comme lu : ${error.message}`,
      );
    }
  }


  /**
   * Supprimer un message
   */
  async delete(id: string) {
    try {
      const message = await this.findOne(id);

      await this.prisma.message.delete({
        where: { id },
      });

      return { message: 'Message supprimé avec succès', deletedId: id };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Erreur lors de la suppression du message : ${error.message}`,
      );
    }
  }

  /**
   * Récupérer les messages non lus d'un utilisateur
   */
  async findUnreadMessages(userId: string) {
    try {
      const messages = await this.prisma.message.findMany({
        where: {
          destinataireId: userId,
          lu: false,
        },
        include: {
          expediteur: true,
        },
        orderBy: {
          dateEnvoi: 'desc',
        },
      });

      return messages;
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la récupération des messages non lus : ${error.message}`,
      );
    }
  }

  /**
   * Compter les messages non lus d'un utilisateur
   */
  async countUnreadMessages(userId: string) {
    try {
      const count = await this.prisma.message.count({
        where: {
          destinataireId: userId,
          lu: false,
        },
      });

      return { userId, unreadCount: count };
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors du comptage des messages non lus : ${error.message}`,
      );
    }
  }
}
