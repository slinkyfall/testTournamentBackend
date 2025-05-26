  // Para TypeORM 0.3.x, usamos un servicio personalizado en lugar de un repositorio
  import { Injectable, NotFoundException } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository, DataSource } from 'typeorm';
  import { Tournament } from '../tournament.entity';

  @Injectable()
  export class TournamentCustomService {
    constructor(
      @InjectRepository(Tournament)
      private tournamentRepository: Repository<Tournament>,
      private dataSource: DataSource
    ) {}

    async getLatestDirectly(): Promise<Tournament> {
      // Ejecutar una consulta SQL directa 
      const result = await this.dataSource.query(`
        SELECT id FROM tournaments 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      
      if (!result || result.length === 0) {
        throw new NotFoundException('No se encontró ningún torneo');
      }
      
      // Cargar el torneo completo usando findOneOrFail para evitar problemas de null
      const latestId = result[0].id;
      
      try {
        const tournament = await this.tournamentRepository.findOne({
          where: { id: latestId },
          relations: ['brackets']
        });
        
        if (!tournament) {
          throw new NotFoundException(`Torneo con ID ${latestId} no encontrado`);
        }
        
        return tournament;
      } catch (error) {
        throw new NotFoundException(`Error al cargar torneo con ID ${latestId}: ${error.message}`);
      }
    }
  }