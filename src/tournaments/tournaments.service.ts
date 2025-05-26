// src/tournaments/tournaments.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from './tournament.entity';
import { Bracket } from './bracket.entity';
import { BracketStyle } from './bracket.entity'; // Importamos BracketStyle
import { CreateTournamentDto } from './dto/create-tournament.dto';

@Injectable()
export class TournamentsService {
  private readonly logger = new Logger(TournamentsService.name);

  constructor(
    @InjectRepository(Tournament)
    private tournamentsRepository: Repository<Tournament>,
    @InjectRepository(Bracket)
    private bracketsRepository: Repository<Bracket>,
  ) {}

  async findAll(): Promise<Tournament[]> {
    this.logger.log('Obteniendo lista de todos los torneos');
    const tournaments = await this.tournamentsRepository.find({ relations: ['brackets'] });
    this.logger.log(`Se encontraron ${tournaments.length} torneos`);
    return tournaments;
  }

  async findById(id: number): Promise<Tournament> {
    this.logger.log(`Buscando torneo con ID: ${id}`);
    
    const tournament = await this.tournamentsRepository.findOne({
      where: { id },
      relations: ['brackets']
    });
    
    if (!tournament) {
      this.logger.warn(`Torneo con ID ${id} no encontrado`);
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }
    
    this.logger.log(`Torneo encontrado: ${tournament.name}`);
    return tournament;
  }

  // Método optimizado para obtener el torneo más reciente
  async getLatestTournament(): Promise<Tournament> {
    this.logger.log('Obteniendo el torneo más reciente');
    
    try {
      // Usar una consulta directa para obtener el torneo más reciente
      const tournament = await this.tournamentsRepository
        .createQueryBuilder('tournament')
        .orderBy('tournament.created_at', 'DESC')
        .leftJoinAndSelect('tournament.brackets', 'brackets')
        .limit(1)
        .getOne();
      
      if (!tournament) {
        this.logger.warn('No se encontró ningún torneo');
        throw new NotFoundException('No se encontró ningún torneo');
      }
      
      this.logger.log(`Torneo más reciente encontrado: ${tournament.name} (ID: ${tournament.id})`);
      return tournament;
    } catch (error) {
      this.logger.error(`Error al obtener torneo más reciente: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(createTournamentDto: CreateTournamentDto): Promise<Tournament> {
    try {
      this.logger.log('======== INICIO CREACIÓN DE TORNEO ========');
      
      // Extract brackets data
      const bracketsData = Array.isArray(createTournamentDto.brackets) 
        ? createTournamentDto.brackets 
        : [];
      
      // Validamos los datos básicos
      if (!createTournamentDto.basics || !createTournamentDto.basics.name || !createTournamentDto.basics.game) {
        throw new Error('Nombre y juego son campos requeridos');
      }
      
      // Create tournament
      let tournamentData: Partial<Tournament> = {
        game: createTournamentDto.basics.game,
        name: createTournamentDto.basics.name,
        start_date: createTournamentDto.basics.start_date 
          ? new Date(createTournamentDto.basics.start_date) 
          : new Date(),
        description: createTournamentDto.info?.description || '',
        rules: createTournamentDto.info?.rules || '',
        prizes: createTournamentDto.info?.prizes || '',
        format_category: createTournamentDto.settings?.format_category || 'standard',
        format: createTournamentDto.settings?.format || 'standard',
        check_in: createTournamentDto.settings?.check_in || false,
        max_participants: createTournamentDto.settings?.max_participants || 32,
        allow_teams: createTournamentDto.settings?.allow_teams || false,
        public_results: createTournamentDto.settings?.public_results !== undefined 
          ? createTournamentDto.settings.public_results 
          : true,
        whatsapp_link: createTournamentDto.resources?.whatsapp_link || '',
      };
      
      // Manejamos check_in_date
      if (createTournamentDto.settings?.check_in_date) {
        try {
          tournamentData.check_in_date = new Date(createTournamentDto.settings.check_in_date);
        } catch (dateError) {
          this.logger.warn(`Error al procesar fecha de check-in: ${dateError.message}`);
        }
      }
      
      // Guardar torneo
      const tournament = this.tournamentsRepository.create(tournamentData);
      const savedTournament = await this.tournamentsRepository.save(tournament);
      
      // Procesar brackets
      if (savedTournament && savedTournament.id && bracketsData.length > 0) {
        for (const bracketData of bracketsData) {
          try {
            // Convertir string a enum BracketStyle
            let bracketStyleEnum: BracketStyle;
            
            if (bracketData.bracketStyle === 'double') {
              bracketStyleEnum = BracketStyle.DOUBLE;
            } else {
              bracketStyleEnum = BracketStyle.SINGLE; // Valor por defecto
            }
            
            // Construimos los datos del bracket con defaults seguros
            const bracketEntity: Partial<Bracket> = {
              name: bracketData.bracketName || `Bracket ${new Date().getTime()}`,
              tournament_id: savedTournament.id,
              style: bracketStyleEnum, // Usar el enum en lugar del string
              third_place_match: bracketData.enableThirdPlace || false,
              size: bracketData.bracketSize || 16,
              match_check_in: bracketData.matchCheckIn || 'Off'
            };
            
            // Manejamos la fecha de forma segura
            try {
              bracketEntity.start_date = bracketData.bracketStartDate ? 
                new Date(`${bracketData.bracketStartDate}T${bracketData.bracketStartTime || '19:00'}:00Z`) : 
                new Date();
            } catch (dateError) {
              this.logger.warn(`Error al procesar fecha de inicio del bracket: ${dateError.message}`);
              bracketEntity.start_date = new Date(); // Usamos fecha actual como fallback
            }
            
            this.logger.log(`Creando bracket "${bracketEntity.name}" para torneo ID: ${savedTournament.id}`);
            
            const bracket = this.bracketsRepository.create(bracketEntity);
            const savedBracket = await this.bracketsRepository.save(bracket);
            
            this.logger.log(`Bracket guardado con ID: ${savedBracket.id}`);
          } catch (bracketError) {
            this.logger.error(`Error al guardar bracket: ${bracketError.message}`);
          }
        }
      }
      
      // Retornar el torneo con sus relaciones
      return this.findById(savedTournament.id);
    } catch (error) {
      this.logger.error(`Error en creación de torneo: ${error.message}`);
      throw error;
    }
  }

  // Otros métodos del servicio como updateBannerImage, etc.
  async updateBannerImage(id: number, imagePath: string): Promise<Tournament> {
    try {
      this.logger.log(`Actualizando imagen de banner para torneo ID: ${id}`);
      
      const tournament = await this.findById(id);
      tournament.banner_image = imagePath;
      
      const updatedTournament = await this.tournamentsRepository.save(tournament);
      this.logger.log(`Imagen de banner actualizada exitosamente para torneo ID: ${id}`);
      
      return updatedTournament;
    } catch (error) {
      this.logger.error(`Error al actualizar imagen de banner para torneo ID: ${id}: ${error.message}`);
      throw error;
    }
  }

  async updateRulesPdf(id: number, pdfPath: string): Promise<Tournament> {
    try {
      this.logger.log(`Actualizando PDF de reglas para torneo ID: ${id}`);
      
      const tournament = await this.findById(id);
      tournament.rules_pdf = pdfPath;
      
      const updatedTournament = await this.tournamentsRepository.save(tournament);
      this.logger.log(`PDF de reglas actualizado exitosamente para torneo ID: ${id}`);
      
      return updatedTournament;
    } catch (error) {
      this.logger.error(`Error al actualizar PDF de reglas para torneo ID: ${id}: ${error.message}`);
      throw error;
    }
  }

  async updateSliderImages(id: number, imagePaths: string[]): Promise<Tournament> {
    try {
      this.logger.log(`Actualizando imágenes del slider para torneo ID: ${id}`);
      
      // Buscar el torneo por ID
      const tournament = await this.findById(id);
      
      // Asignar directamente el array (no como string JSON)
      tournament.slider_images = imagePaths;
      
      // Guardar usando el método save que maneja los tipos correctamente
      const updatedTournament = await this.tournamentsRepository.save(tournament);
      
      this.logger.log(`Imágenes del slider actualizadas exitosamente para torneo ID: ${id}`);
      return updatedTournament;
    } catch (error) {
      this.logger.error(`Error al actualizar imágenes del slider para torneo ID: ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      this.logger.log(`Eliminando torneo ID: ${id}`);
      
      const tournament = await this.findById(id);
      await this.tournamentsRepository.remove(tournament);
      
      this.logger.log(`Torneo ID: ${id} eliminado exitosamente`);
    } catch (error) {
      this.logger.error(`Error al eliminar torneo ID: ${id}: ${error.message}`);
      throw error;
    }
  }

  async update(id: number, updateData: any): Promise<Tournament> {
    this.logger.log(`Actualizando torneo con ID: ${id}`);
    
    // Verificamos que el torneo exista
    const tournament = await this.findById(id);
    
    // Actualizamos los datos básicos
    tournament.game = updateData.game;
    tournament.name = updateData.name;
    tournament.start_date = new Date(updateData.start_date);
    tournament.description = updateData.description;
    tournament.rules = updateData.rules;
    tournament.prizes = updateData.prizes;
    tournament.format_category = updateData.format_category;
    tournament.format = updateData.format;
    tournament.check_in = updateData.check_in;
    
    // Manejar check_in_date
    if (updateData.check_in_date) {
      try {
        tournament.check_in_date = new Date(updateData.check_in_date);
      } catch (dateError) {
        this.logger.warn(`Error al procesar fecha de check-in: ${dateError.message}`);
      }
    } else {
      tournament.check_in_date = null;
    }
    
    tournament.max_participants = updateData.max_participants;
    tournament.allow_teams = updateData.allow_teams;
    tournament.max_team_members = updateData.max_team_members;
    tournament.public_results = updateData.public_results;
    tournament.whatsapp_link = updateData.whatsapp_link;
    
    // Guardamos los cambios
    const updatedTournament = await this.tournamentsRepository.save(tournament);
    this.logger.log(`Torneo con ID ${id} actualizado exitosamente`);
    
    return updatedTournament;
  }
}