// src/participants/participants.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';
import { TournamentParticipant } from './participant.entity';
import { Tournament } from '../tournaments/tournament.entity';
import { User } from '../users/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TournamentParticipant, Tournament, User]),
    MulterModule.register({
      dest: '../public/images',
    }),
    AuthModule,
  ],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}