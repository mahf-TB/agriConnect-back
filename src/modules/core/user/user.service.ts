import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { hashPassword } from 'src/common/utils/password.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const hashedPassword = await hashPassword(data.mot_de_passe);
    return this.prisma.user.create({
      data: {
        ...data,
        mot_de_passe: hashedPassword,
      },
    });
  }
  async findAll() {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        avatar: true,
        adresse: true,
        localisation: true,
        latitude: true,
        longitude: true,
        statut: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) return null;
    const { mot_de_passe, ...rest } = user;
    return rest;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, data: UpdateUserDto) {
    return await this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return await this.prisma.user.delete({ where: { id } });
  }
}
