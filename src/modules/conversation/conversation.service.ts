import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { getFullUrl } from 'src/common/utils/file';
import { MessagingGateway } from 'src/websockets/messaging/messaging.gateway';

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MessagingGateway,
  ) {}

  /**
   * Créer une nouvelle conversation entre deux utilisateurs
   */
  async create(dto: CreateConversationDto) {
    try {
      // Vérifier que les deux participants existent
      const [participant1, participant2] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: dto.participant1Id } }),
        this.prisma.user.findUnique({ where: { id: dto.participant2Id } }),
      ]);

      if (!participant1 || !participant2) {
        throw new BadRequestException(
          'Un ou les deux participants non trouvés',
        );
      }

      if (dto.participant1Id === dto.participant2Id) {
        throw new BadRequestException(
          'Un utilisateur ne peut pas converser avec lui-même',
        );
      }

      // Vérifier si une conversation existe déjà (order agnostic)
      const existingConversation = await this.prisma.conversation.findUnique({
        where: {
          participant1Id_participant2Id: {
            participant1Id: dto.participant1Id,
            participant2Id: dto.participant2Id,
          },
        },
      });

      if (existingConversation) {
        return existingConversation;
      }

      // Créer une nouvelle conversation
      const conversation = await this.prisma.conversation.create({
        data: {
          participant1Id: dto.participant1Id,
          participant2Id: dto.participant2Id,
        },
        include: {
          participant1: true,
          participant2: true,
          dernierMessage: true,
        },
      });

      return conversation;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Erreur lors de la création de la conversation : ${error.message}`,
      );
    }
  }

  /**
   * Récupérer une conversation par ID
   */
  async findOne(id: string) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id },
        include: {
          participant1: true,
          participant2: true,
          dernierMessage: true,
          messages: {
            orderBy: { dateEnvoi: 'desc' },
            take: 50, // Derniers 50 messages
          },
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation non trouvée');
      }

      return conversation;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Erreur lors de la récupération de la conversation : ${error.message}`,
      );
    }
  }

  /**
   * Récupérer toutes les conversations d'un utilisateur
   */
  async findByUserId(userId: string, req?: any) {
    try {
      const conversations = await this.prisma.conversation.findMany({
        where: {
          OR: [
            { participant1Id: userId, archiveP1: false },
            { participant2Id: userId, archiveP2: false },
          ],
        },
        include: {
          participant1: true,
          participant2: true,
          dernierMessage: {
            include: {
              expediteur: true,
            },
          },
        },
        orderBy: {
          dateDerniereActivite: 'desc',
        },
      });

      // Supprimer le champ mot_de_passe des utilisateurs retournés
      const sanitized = conversations.map((c) => {
        const conv: any = { ...c };

        if (conv.participant1 && 'mot_de_passe' in conv.participant1) {
          const { mot_de_passe, avatar, ...rest } = conv.participant1;

          conv.participant1 = {
            ...rest,
            avatar: avatar ? getFullUrl(req, avatar) : null,
          };
        }

        if (conv.participant2 && 'mot_de_passe' in conv.participant2) {
          const { mot_de_passe, avatar, ...rest } = conv.participant2;
          conv.participant2 = {
            ...rest,
            avatar: avatar ? getFullUrl(req, avatar) : null,
          };
        }

        if (
          conv.dernierMessage &&
          conv.dernierMessage.expediteur &&
          'mot_de_passe' in conv.dernierMessage.expediteur
        ) {
          const { mot_de_passe, avatar, ...rest } =
            conv.dernierMessage.expediteur;
          conv.dernierMessage.expediteur = {
            ...rest,
            avatar: avatar ? getFullUrl(req, avatar) : null,
          };
        }

        return conv;
      });

      return sanitized;
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la récupération des conversations : ${error.message}`,
      );
    }
  }

  /**
   * Marquer toute une conversation comme lue
   */

  async markConversationAsRead(conversationId: string, readerId: string) {
    return await this.prisma.$transaction(async (tx) => {
      // 1️⃣ Récupérer la conversation
      const conversation = await tx.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation introuvable');
      }

      // 2️⃣ Déterminer si l'utilisateur est P1 ou P2
      let isP1 = false;
      let isP2 = false;

      if (conversation.participant1Id === readerId) {
        isP1 = true;
      } else if (conversation.participant2Id === readerId) {
        isP2 = true;
      } else {
        throw new ForbiddenException(
          'Vous ne faites pas partie de cette conversation',
        );
      }

      const now = new Date();

      // 3️⃣ Marquer tous les messages non lus destinés à ce user comme lus
      const updateMessages = await tx.message.updateMany({
        where: {
          conversationId,
          destinataireId: readerId,
          lu: false,
        },
        data: {
          lu: true,
          dateLecture: now,
        },
      });

      // 4️⃣ Remettre à zéro les compteurs
       await tx.conversation.update({
        where: { id: conversationId },
        data: {
          messagesNonLusP1: isP1 ? 0 : undefined,
          messagesNonLusP2: isP2 ? 0 : undefined,
          dateDerniereActivite: now,
        },
      });


      this.gateway.sendMessageReadToUser(conversationId, {
          conversationId,
          readerId,
          readAt: now,
          updatedMessages: updateMessages.count,
        });

      return {
        conversationId,
        readAt: now,
        updatedMessages: updateMessages.count,
      };
    });
  }

  /**
   * Récupérer les conversations archivées d'un utilisateur
   */
  async findArchivedByUserId(userId: string) {
    try {
      const conversations = await this.prisma.conversation.findMany({
        where: {
          OR: [
            { participant1Id: userId, archiveP1: true },
            { participant2Id: userId, archiveP2: true },
          ],
        },
        include: {
          participant1: true,
          participant2: true,
          dernierMessage: true,
        },
        orderBy: {
          dateDerniereActivite: 'desc',
        },
      });

      return conversations;
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la récupération des conversations archivées : ${error.message}`,
      );
    }
  }

  /**
   * Trouver ou créer une conversation entre deux utilisateurs
   */
  async findOrCreate(participant1Id: string, participant2Id: string) {
    try {
      // Vérifier l'existence d'une conversation
      let conversation = await this.prisma.conversation.findUnique({
        where: {
          participant1Id_participant2Id: {
            participant1Id,
            participant2Id,
          },
        },
        include: {
          participant1: true,
          participant2: true,
        },
      });

      // Si elle existe, retourner la conversation existante
      if (conversation) {
        return conversation;
      }

      //  return await this.prisma.conversation.create({
      //     participant1Id,
      //     participant2Id
      //   });
      return await this.prisma.conversation.create({
        data: {
          participant1Id,
          participant2Id,
        },
        include: {
          participant1: true,
          participant2: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la recherche/création de la conversation : ${error.message}`,
      );
    }
  }

  /**
   * Mettre à jour une conversation (archivage, etc.)
   */
  async update(id: string, dto: UpdateConversationDto, userId: string) {
    try {
      const conversation = await this.findOne(id);

      // Déterminer quel participant effectue l'action
      const isParticipant1 = conversation.participant1Id === userId;
      const isParticipant2 = conversation.participant2Id === userId;

      if (!isParticipant1 && !isParticipant2) {
        throw new BadRequestException(
          "Vous n'êtes pas participant de cette conversation",
        );
      }

      const updateData: any = {};

      if (isParticipant1 && dto.archiveP1 !== undefined) {
        updateData.archiveP1 = dto.archiveP1;
      }
      if (isParticipant2 && dto.archiveP2 !== undefined) {
        updateData.archiveP2 = dto.archiveP2;
      }

      const updatedConversation = await this.prisma.conversation.update({
        where: { id },
        data: updateData,
        include: {
          participant1: true,
          participant2: true,
          dernierMessage: true,
        },
      });

      return updatedConversation;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Erreur lors de la mise à jour de la conversation : ${error.message}`,
      );
    }
  }

  /**
   * Mettre à jour le dernier message d'une conversation
   */
  async updateLastMessage(conversationId: string, messageId: string) {
    try {
      const conversation = await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          dernierMessageId: messageId,
          dateDerniereActivite: new Date(),
        },
        include: {
          participant1: true,
          participant2: true,
          dernierMessage: true,
        },
      });

      return conversation;
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la mise à jour du dernier message : ${error.message}`,
      );
    }
  }

  /**
   * Réinitialiser le compteur de messages non lus
   */
  async resetUnreadCount(conversationId: string, userId: string) {
    try {
      const conversation = await this.findOne(conversationId);

      const isParticipant1 = conversation.participant1Id === userId;
      const isParticipant2 = conversation.participant2Id === userId;

      if (!isParticipant1 && !isParticipant2) {
        throw new BadRequestException(
          "Vous n'êtes pas participant de cette conversation",
        );
      }

      const updateData: any = {};
      if (isParticipant1) {
        updateData.messagesNonLusP1 = 0;
      }
      if (isParticipant2) {
        updateData.messagesNonLusP2 = 0;
      }

      const updatedConversation = await this.prisma.conversation.update({
        where: { id: conversationId },
        data: updateData,
      });

      return updatedConversation;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Erreur lors de la réinitialisation du compteur : ${error.message}`,
      );
    }
  }

  /**
   * Incrémenter le compteur de messages non lus
   */
  async incrementUnreadCount(conversationId: string, destinataireId: string) {
    try {
      const conversation = await this.findOne(conversationId);

      const isParticipant1 = conversation.participant1Id === destinataireId;
      const isParticipant2 = conversation.participant2Id === destinataireId;

      const updateData: any = {};
      if (isParticipant1) {
        updateData.messagesNonLusP1 = { increment: 1 };
      } else if (isParticipant2) {
        updateData.messagesNonLusP2 = { increment: 1 };
      }

      const updatedConversation = await this.prisma.conversation.update({
        where: { id: conversationId },
        data: updateData,
      });

      return updatedConversation;
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de l'incrémentation du compteur : ${error.message}`,
      );
    }
  }

  /**
   * Supprimer une conversation (soft delete par archivage)
   */
  async archive(id: string, userId: string) {
    try {
      return await this.update(
        id,
        {
          archiveP1: userId === (await this.findOne(id)).participant1Id,
          archiveP2: userId === (await this.findOne(id)).participant2Id,
        },
        userId,
      );
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de l'archivage de la conversation : ${error.message}`,
      );
    }
  }

  /**
   * Récupérer les messages d'une conversation avec pagination
   */
  async getMessagesWithPagination(
    conversationId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        this.prisma.message.findMany({
          where: { conversationId },
          include: {
            expediteur: true,
            destinataire: true,
          },
          orderBy: { dateEnvoi: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.message.count({ where: { conversationId } }),
      ]);

      return {
        messages: messages.reverse(),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la récupération des messages : ${error.message}`,
      );
    }
  }
}
