// src/tournaments/dto/create-tournament.dto.ts
import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested, IsNotEmpty, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class BasicsDto {
  @IsNotEmpty()
  @IsString()
  game: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsDateString()
  start_date: string;
}

export class InfoDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  rules?: string;

  @IsOptional()
  @IsString()
  prizes?: string;
}

export class SettingsDto {
  @IsNotEmpty()
  @IsString()
  format_category: string;

  @IsNotEmpty()
  @IsString()
  format: string;

  @IsBoolean()
  check_in: boolean;

  @IsOptional()
  @IsDateString()
  check_in_date?: string;

  @IsNumber()
  max_participants: number;

  @IsBoolean()
  allow_teams: boolean;

  @IsBoolean()
  public_results: boolean;
}

export class ResourcesDto {
  @IsOptional()
  @IsString()
  whatsapp_link?: string;
}

export class BracketDto {
  @IsString()
  bracketName: string;

  @IsDateString()
  bracketStartDate: string;

  @IsString()
  bracketStartTime: string;

  @IsString()
  matchCheckIn: string;

  @IsString()
  bracketStyle: string;

  @IsBoolean()
  enableThirdPlace: boolean;

  @IsNumber()
  bracketSize: number;
}

export class CreateTournamentDto {
  @ValidateNested()
  @Type(() => BasicsDto)
  basics: BasicsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InfoDto)
  info?: InfoDto;

  @ValidateNested()
  @Type(() => SettingsDto)
  settings: SettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ResourcesDto)
  resources?: ResourcesDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BracketDto)
  brackets?: BracketDto[];
}