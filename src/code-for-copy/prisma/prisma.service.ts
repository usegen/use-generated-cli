
import {INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
    // constructor() {
    //   super({
    //     log: [
    //       { emit: 'event', level: 'query' },
    //       { emit: 'stdout', level: 'info' },
    //       { emit: 'stdout', level: 'warn' },
    //       { emit: 'stdout', level: 'error' },
    //     ],
    //     errorFormat: 'colorless',
    //   });
    // }
  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
  // async enableShutdownHooks(app: INestApplication) {
  //   this.$on('beforeExit', async (event) => {
  //     console.log(event.name);
  //     await app.close();
  //   });
  // }
}

@Injectable()
export class TestService {
  constructor(private prismaService: PrismaService) {
    prismaService.$on<any>('query', (event: Prisma.QueryEvent) => {
      console.log('Query: ' + event.query);
      console.log('Duration: ' + event.duration + 'ms');
    });
  }
}