import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Enum para el campo de género
export enum UserGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  NOT_SPECIFIED = 'not_specified'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: true })
  username?: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password_hash!: string;

  // Datos personales
  @Column()
  first_name!: string;

  @Column({ nullable: true })
  middle_name?: string;

  @Column()
  last_name!: string;

  @Column()
  second_last_name!: string;

  @Column({ type: 'date' })
  birth_date!: Date;

  // Nuevo campo para almacenar la edad
  @Column({ type: 'int' })
  age!: number;

  @Column()
  curp!: string; // Se guardará en mayúsculas

  @Column({
    type: 'enum',
    enum: UserGender,
    default: UserGender.NOT_SPECIFIED
  })
  gender!: UserGender;

  @Column({ nullable: true })
  custom_gender?: string;

  // Datos de ubicación
  @Column()
  state!: string; // Ahora será texto libre

  @Column()
  municipality!: string; // Ahora será texto libre

  @Column()
  postal_code!: string;

  // Datos de contacto y verificación
  @Column()
  phone!: string;

  @Column({ default: false })
  email_verified!: boolean;

  @Column({ default: false })
  phone_verified!: boolean;

  // Opción de inicio de sesión con Google
  @Column({ nullable: true })
  google_id?: string;

  // Datos de sistema
  @Column({ default: true })
  is_active!: boolean;

  @Column({ nullable: true })
  last_login_at?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Método para validar contraseña
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }
}