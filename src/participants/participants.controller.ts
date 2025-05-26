// src/participants/participants.controller.ts
import { Controller, Post, Body, Get, Query, Param, Delete, UseGuards, UseInterceptors, UploadedFiles, ParseIntPipe } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ParticipantsService } from './participants.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { multerStorage } from '../config/multer.config';

@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'teamLogo', maxCount: 1 },
      { name: 'parentalConsent', maxCount: 1 },
    ], {
      storage: multerStorage('public/images/'),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg)$/)) {
          return callback(new Error('Solo se permiten archivos JPG!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB max
      },
    }),
  )
  async createParticipant(
    @Body() createParticipantDto: CreateParticipantDto,
    @UploadedFiles() files: { teamLogo?: Express.Multer.File[], parentalConsent?: Express.Multer.File[] },
  ) {
    console.log('Datos recibidos en el controlador:', createParticipantDto);
    console.log('Archivos recibidos:', files);
    
    return this.participantsService.create(
      createParticipantDto, 
      files?.teamLogo?.[0], 
      files?.parentalConsent?.[0]
    );
  }

  @Get()
  
  @Roles('admin')
  async findAll(
    
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.participantsService.findAll(
      
      search,
      page,
      limit,
    );
  }

  @Get(':id')
  
  @Roles('admin')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.participantsService.findOne(id);
  }

  @Delete(':id')
  
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.participantsService.remove(id);
  }
}