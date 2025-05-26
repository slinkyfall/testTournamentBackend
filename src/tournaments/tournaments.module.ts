// backend/src/tournaments/tournaments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Tournament } from './tournament.entity';
import { Bracket } from './bracket.entity';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tournament, Bracket]),
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}