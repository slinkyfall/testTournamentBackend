// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { User } from './users/user.entity';
import { Tournament } from './tournaments/tournament.entity';
import { Bracket } from './tournaments/bracket.entity';
import { ParticipantsModule } from './participants/participants.module';
import { TournamentParticipant } from './participants/participant.entity';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as fs from 'fs';

const rootDir = join(__dirname, '..','..');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes environment variables available throughout the app
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [User, Tournament, Bracket, TournamentParticipant],
        synchronize: false, // Auto-create database schema (use carefully in production)
        logging: true, // Activa esto para ver las consultas SQL
        ssl: {
          rejectUnauthorized: false,
        }, //solo uso para render :3
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(rootDir, '..', 'public'),
      serveRoot: '/public',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(rootDir, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    UsersModule,
    TournamentsModule,
    ParticipantsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}