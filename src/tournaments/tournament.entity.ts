// backend/src/tournaments/tournament.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Bracket } from './bracket.entity';

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  game!: string;

  @Column()
  name!: string;

  @Column({ type: 'timestamp with time zone' })
  start_date!: Date;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ nullable: true, type: 'text' })
  rules?: string;

  @Column({ nullable: true, type: 'text' })
  prizes?: string;

  @Column()
  format_category!: string;

  @Column()
  format!: string;

  @Column({ default: false })
  check_in!: boolean;

  @Column({ nullable: true, type: 'timestamp with time zone' })
  check_in_date?: Date | null;

  @Column()
  max_participants!: number;

  @Column({ default: false })
  allow_teams!: boolean;

  @Column({ name: 'max_team_members', nullable: true })
  max_team_members?: number;

  @Column({ default: true })
  public_results!: boolean;

  @Column({ nullable: true })
  banner_image?: string;

  @Column({ nullable: true })
  rules_pdf?: string;

  @Column('text', { array: true, nullable: true, default: [] })
  slider_images?: string[];

  @Column({ nullable: true })
  whatsapp_link?: string;

  @OneToMany(() => Bracket, bracket => bracket.tournament)
  brackets!: Bracket[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}