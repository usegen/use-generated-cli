import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateDto } from './dto';

@Injectable()
export class AuthUserService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByToken(token: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { resetToken: token } });
  }

  async create(user: CreateDto): Promise<void> {
    await this.prisma.user.create({
      data: {
        ...user,
      },
    });
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
      },
    });
  }

  async updateToken(email: string, token: string): Promise<void> {
    await this.prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
      },
    });
  }
}