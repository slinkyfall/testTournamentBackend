// backend/src/tournaments/bracket.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tournament } from './tournament.entity';

export enum BracketStyle {
  SINGLE = 'single',
  DOUBLE = 'double'
}

@Entity('brackets')
export class Bracket {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'timestamp with time zone' })
  start_date!: Date;

  @Column({ default: 'Off' })
  match_check_in!: string;

  @Column({
    type: 'enum',
    enum: BracketStyle,
    default: BracketStyle.SINGLE
  })
  style!: BracketStyle;

  @Column({ default: false })
  third_place_match!: boolean;

  @Column()
  size!: number;

  @ManyToOne(() => Tournament, tournament => tournament.brackets)
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @Column()
  tournament_id!: number;
}