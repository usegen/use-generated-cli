import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';

import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';



@Module({
  imports: [  
    GraphQLModule.forRoot({
      debug: true,
      introspection:true,
      playground: true,
      
      autoSchemaFile: 'schema.gql',
      context: ({ req }) => ({ req }),
      driver: ApolloDriver
  }),
  MailerModule.forRoot({
    transport: 'smtps://user@domain.com:pass@smtp.domain.com',
    defaults: {
      from: '"nest-modules" <modules@nestjs.com>',
    },
    preview: true,
    template: {
      dir:`${process.cwd()}/mailtemplates`,
      adapter: new HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
  })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
