// src/participants/dto/create-participant.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum Platform {
  PC = 'pc',
  PS5 = 'ps5',
  XBOX = 'xbox',
  NINTENDO = 'nintendo',
  MOBILE = 'mobile'
}

export enum RegistrationType {
  TEAM = 'team',
  SOLITAIRE = 'solitaire',
  JOIN = 'join'
}

export class CreateParticipantDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  username: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  rank?: string;

  @IsNotEmpty()
  @IsEnum(Platform)
  platform: Platform;

  @IsNotEmpty()
  @IsEnum(RegistrationType)
  registration_type: RegistrationType;

  // Campos específicos para registro de equipo - Versión camelCase
  @IsOptional()
  @IsString()
  @MaxLength(100)
  teamName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  teamTag?: string;

  @IsOptional()
  teamDescription?: string;

  @IsOptional()
  isPublic?: boolean;

  // Campos para contacto - Versión camelCase
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  discordId?: string;

  // Campo para código de invitación - Versión camelCase
  @IsOptional()
  @IsString()
  @MaxLength(20)
  invitationCode?: string;
}