// src/participants/participant.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('tournament_participants')
export class TournamentParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'team_id', nullable: true })
  teamId: number;

  @Column({ name: 'tournament_id', nullable: true })
  tournamentId: number;

  @Column({ length: 100 })
  username: string;

  @Column({ length: 100, nullable: true })
  rank: string;

  @Column({ length: 50 })
  platform: string;

  @Column({ name: 'invitation_code', length: 20, nullable: true })
  invitationCode: string;

  @Column({ name: 'contact_info', length: 100, nullable: true })
  contactInfo: string;

  @Column({ name: 'registration_type', length: 20 })
  registrationType: string;

  @Column({ name: 'current_team_size', default: 1 })
  currentTeamSize: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}