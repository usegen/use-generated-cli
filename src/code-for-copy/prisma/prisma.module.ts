
import { Module } from '@nestjs/common';
import { PrismaService,TestService } from './prisma.service';

@Module({
  providers: [PrismaService,TestService],
  exports: [PrismaService,TestService],
})
export class PrismaModule {}