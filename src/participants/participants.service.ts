// src/participants/participants.service.ts
// src/participants/participants.service.ts
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { TournamentParticipant } from './participant.entity';
import { CreateParticipantDto } from './dto/create-participant.dto';
import * as fs from 'fs';
import * as path from 'path';
import { Tournament } from '../tournaments/tournament.entity';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(TournamentParticipant)
    private participantRepository: Repository<TournamentParticipant>,
    @InjectRepository(Tournament)
    private tournamentRepository: Repository<Tournament>,
  ) {}

  async create(
    createParticipantDto: CreateParticipantDto, 
    teamLogo?: Express.Multer.File,
    parentalConsent?: Express.Multer.File
  ): Promise<TournamentParticipant> {
    console.log('Procesando creación de participante:', createParticipantDto);
    console.log('Archivos recibidos:', { teamLogo, parentalConsent });
    
    const { registration_type, invitationCode } = createParticipantDto;

    // Si es un registro para unirse a un equipo
    if (registration_type === 'join' && invitationCode) {
      // Buscar el líder del equipo
      const teamLeader = await this.participantRepository.findOne({
        where: { invitationCode, registrationType: 'team' }
      });
      
      if (teamLeader) {
        // Buscar el torneo asociado para obtener el máximo de miembros permitidos
        const tournament = await this.tournamentRepository.findOne({
          where: { id: teamLeader.tournamentId }
        });
        
        if (!tournament) {
          throw new BadRequestException('No se encontró el torneo asociado al equipo');
        }
        
        // Verificar si existe maxTeamMembers en el torneo
        if (tournament.max_team_members) {
          // Contar miembros actuales del equipo
          const teamMembersCount = await this.participantRepository.count({
            where: { invitationCode }
          });
          
          // Verificar si el equipo está lleno
          if (teamMembersCount >= tournament.max_team_members) {
            throw new BadRequestException(
              `El equipo está completo. Ya ha alcanzado el máximo de ${tournament.max_team_members} miembros permitidos.`
            );
          }
          
          // Preparar el nuevo participante
          const newParticipant = new TournamentParticipant();
          newParticipant.username = createParticipantDto.username;
          newParticipant.rank = createParticipantDto.rank || '';
          newParticipant.platform = createParticipantDto.platform;
          newParticipant.contactInfo = createParticipantDto.contactInfo || createParticipantDto.discordId || '';
          newParticipant.registrationType = registration_type;
          newParticipant.teamId = teamLeader.id;
          newParticipant.invitationCode = invitationCode;
          newParticipant.currentTeamSize = teamMembersCount + 1;
          
          // Actualizar el tamaño del equipo para todos los miembros
          await this.participantRepository.update(
            { invitationCode },
            { currentTeamSize: teamMembersCount + 1 }
          );
          
          // Guardar el nuevo participante
          return await this.participantRepository.save(newParticipant);
        }
      }
    }
    
    // Crear nuevo participante directamente sin verificaciones de usuario/torneo
    const newParticipant = new TournamentParticipant();
    newParticipant.username = createParticipantDto.username;
    newParticipant.rank = createParticipantDto.rank || '';
    newParticipant.platform = createParticipantDto.platform;
    
    // Manejar campos con diferentes convenciones de nomenclatura
    newParticipant.contactInfo = 
      createParticipantDto.contactInfo || 
      createParticipantDto.discordId || 
      '';
      
    newParticipant.registrationType = registration_type;

    // Procesamiento específico según el tipo de registro
    try {
      switch (registration_type) {
        case 'team':
          // Generar código de invitación si no existe
          newParticipant.invitationCode = createParticipantDto.invitationCode || this.generateInvitationCode();
          
          // Manejar logo si existe
          if (teamLogo) {
            console.log('Procesando logo de equipo:', teamLogo);
            const teamNameForFile = createParticipantDto.teamName || 'equipo';
            const logoName = `${teamNameForFile.replace(/\s/g, '_')}.jpg`;
            const logoPath = path.join('public/images/', logoName);
            
            try {
              // Asegurarnos de que el directorio existe
              const dir = path.dirname(logoPath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              
              // Mover archivo a su ubicación final
              fs.renameSync(teamLogo.path, logoPath);
              console.log(`Archivo guardado en: ${logoPath}`);
            } catch (err) {
              console.error('Error al guardar el logo:', err);
            }
          }
          break;
          
        case 'solitaire':
          // No requiere campos adicionales
          break;
          
        case 'join':
          // Buscar información del equipo por código de invitación
          if (createParticipantDto.invitationCode) {
            const teamLeader = await this.participantRepository.findOne({
              where: { invitationCode: createParticipantDto.invitationCode }
            });
            
            if (teamLeader) {
              newParticipant.teamId = teamLeader.id;
              newParticipant.invitationCode = createParticipantDto.invitationCode;
            }
          }
          break;
          
        default:
          throw new BadRequestException('Tipo de registro inválido');
      }

      // Guardar participante en la base de datos
      const savedParticipant = await this.participantRepository.save(newParticipant);
      console.log('Participante guardado con éxito:', savedParticipant);
      
      return savedParticipant;
    } catch (error) {
      console.error('Error al procesar el registro:', error);
      throw error;
    }
  }


  private generateInvitationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    
    for (let i = 0; i < 8; i++) {
      if (i === 4) code += '-';
      const randomIndex = Math.floor(Math.random() * chars.length);
      code += chars[randomIndex];
    }
    
    return code;
  }
  // Implementación básica de findAll para que el servicio sea funcional
  async findAll(
    search?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: TournamentParticipant[]; total: number }> {
    const where: any = {};
    
    if (search) {
      where.username = Like(`%${search}%`);
    }
    
    const [participants, total] = await this.participantRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    
    return { data: participants, total };
  }

  // Implementación básica de findOne para que el servicio sea funcional
  async findOne(id: number): Promise<TournamentParticipant> {
    const participant = await this.participantRepository.findOne({
      where: { id },
    });
    
    if (!participant) {
      throw new BadRequestException(`Participante con ID ${id} no encontrado`);
    }
    
    return participant;
  }

  // Implementación básica de remove para que el servicio sea funcional
  async remove(id: number): Promise<void> {
    const result = await this.participantRepository.delete(id);
    
    if (result.affected === 0) {
      throw new BadRequestException(`Participante con ID ${id} no encontrado`);
    }
  }
}