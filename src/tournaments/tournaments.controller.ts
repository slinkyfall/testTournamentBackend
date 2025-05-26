// src/tournaments/tournaments.controller.ts
import { Controller, Get, Post, Body, Param, Delete, Logger, NotFoundException, InternalServerErrorException, UseInterceptors, UploadedFile, UploadedFiles, Put } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

// Obtener la ruta absoluta del directorio raíz del proyecto
const rootDir = path.join(__dirname, '..', '..', '..'); // Sube dos niveles desde src/tournaments
const publicImagesDir = path.join(rootDir, 'public', 'images');
const publicDocumentsDir = path.join(rootDir, 'public', 'documents');

// Función de limpieza de archivos
const cleanupSpecificFiles = (): void => {
  try {
    // Verificar si el directorio existe
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
      console.log(`Created directory: ${publicImagesDir}`);
      return;
    }
    
    // Patrones de archivos a eliminar
    const filePatterns = [
      'banner',
      'slider1',
      'slider2',
      'slider3',
      'slider4',
      'slider5'
    ];
    
    // Leer todos los archivos en el directorio
    const files = fs.readdirSync(publicImagesDir);
    
    // Filtrar y eliminar archivos que coinciden con los patrones
    for (const file of files) {
      for (const pattern of filePatterns) {
        // Comprobar si el nombre del archivo comienza con el patrón (sin importar la extensión)
        if (file.startsWith(pattern + '.')) {
          const filePath = path.join(publicImagesDir, file);
          console.log(`Removing file: ${filePath}`);
          fs.unlinkSync(filePath);
          break; // Salir del bucle interno una vez que se ha encontrado
        }
      }
    }
    
    console.log('File cleanup completed successfully');
  } catch (error) {
    console.error(`Error during file cleanup: ${error.message}`);
    // No lanzamos el error para no interrumpir el proceso
  }
};


// Crear directorios si no existen
function ensureDirectoryExists(directory: string) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`Created directory: ${directory}`);
  }
}

// Asegurar que los directorios existan
ensureDirectoryExists(publicImagesDir);
ensureDirectoryExists(publicDocumentsDir);

// Configuraciones de almacenamiento
const storageConfig = {
  banner: diskStorage({
    destination: publicImagesDir,
    filename: (req, file, cb) => {
      // Always save as banner.jpg (or keep original extension)
      const ext = path.extname(file.originalname);
      cb(null, `banner${ext}`);
    }
  }),
  slider: diskStorage({
    destination: publicImagesDir,
    filename: (req, file, cb) => {
      // Get the current file index from the request
      const fileIndex = req.fileIndex || 1;
      req.fileIndex = fileIndex + 1;
      
      // Save as slider1.jpg, slider2.jpg, etc.
      const ext = path.extname(file.originalname);
      cb(null, `slider${fileIndex}${ext}`);
    }
  }),
  pdf: diskStorage({
    destination: publicDocumentsDir,
    filename: (req, file, cb) => {
      // Save PDF with tournament ID in name
      const tournamentId = req.params.id;
      cb(null, `rules_${tournamentId}.pdf`);
    }
  })
};

@Controller('api/tournaments')
export class TournamentsController {
  private readonly logger = new Logger(TournamentsController.name);

  constructor(
    private readonly tournamentService: TournamentsService
  ) {
    // Asegurarse de que los directorios existan
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }
    if (!fs.existsSync(publicDocumentsDir)) {
      fs.mkdirSync(publicDocumentsDir, { recursive: true });
    }
  }

  // Endpoint principal para obtener todos los torneos
  @Get()
  async getAllTournaments() {
    this.logger.log('Solicitando todos los torneos');
    try {
      const tournaments = await this.tournamentService.findAll();
      return tournaments;
    } catch (error) {
      this.logger.error(`Error al obtener todos los torneos: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al obtener torneos');
    }
  }

  @Post('cleanup-files')
  async cleanupFiles() {
    this.logger.log('Iniciando limpieza de archivos');
    try {
      cleanupSpecificFiles();
      return { success: true, message: 'Limpieza de archivos completada exitosamente' };
    } catch (error) {
      this.logger.error(`Error durante la limpieza de archivos: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error durante la limpieza de archivos');
    }
  }

  // Endpoint para obtener el último torneo
  @Get('latest')
  async getLatestTournament() {
    this.logger.log('Obteniendo el torneo más reciente');
    
    try {
      const tournament = await this.tournamentService.getLatestTournament();
      return tournament;
    } catch (error) {
      this.logger.error(`Error al obtener el último torneo: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al obtener el último torneo');
    }
  }

  // Endpoint para obtener un torneo por ID
  @Get(':id')
  async getTournament(@Param('id') id: string) {
    this.logger.log(`Solicitando torneo con ID: ${id}`);
    try {
      const tournament = await this.tournamentService.findById(Number(id));
      return tournament;
    } catch (error) {
      this.logger.error(`Error al obtener torneo con ID ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error al obtener torneo con ID: ${id}`);
    }
  }

  // Endpoint para crear un torneo
  @Post()
  async createTournament(@Body() createTournamentDto: CreateTournamentDto) {
    this.logger.log('Creando nuevo torneo');

    cleanupSpecificFiles();

    try {
      const tournament = await this.tournamentService.create(createTournamentDto);
      return tournament;
    } catch (error) {
      this.logger.error(`Error al crear torneo: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al crear torneo');
    }
  }

  // Upload banner image endpoint
  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image', {
    storage: storageConfig.banner,
    fileFilter: (req, file, cb) => {
      // Check if file is an image
      if (!file.mimetype.includes('image')) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      
      // Check if banner.jpg already exists - if it does, delete it
      const ext = path.extname(file.originalname);
      const filePath = path.join(publicImagesDir, `banner${ext}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      cb(null, true);
    }
  }))
  async uploadBannerImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    this.logger.log(`Uploading banner image for tournament ID: ${id}`);
    
    try {
      // File is already saved to disk by multer
      if (!file) {
        throw new Error('No file uploaded');
      }
      
      // Update tournament with new banner image path
      const imagePath = file.filename;
      const updatedTournament = await this.tournamentService.updateBannerImage(+id, imagePath);
      
      return {
        success: true,
        message: 'Banner image uploaded successfully',
        bannerPath: imagePath
      };
    } catch (error) {
      this.logger.error(`Error uploading banner image: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Error uploading banner image: ${error.message}`);
    }
  }

  // Upload slider images endpoint (handles multiple files)
  @Post(':id/slider')
  @UseInterceptors(FilesInterceptor('slider', 5, {
    storage: storageConfig.slider,
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.includes('image')) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      
      // Initialize file index in request object if not already set
      if (req.fileIndex === undefined) {
        req.fileIndex = 1;
      }
      
      // Check if a slider file with the current index already exists - if it does, delete it
      const ext = path.extname(file.originalname);
      const filePath = path.join(publicImagesDir, `slider${req.fileIndex}${ext}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      cb(null, true);
    }
  }))
  async uploadSliderImages(
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    this.logger.log(`Uploading ${files.length} slider images for tournament ID: ${id}`);
    
    try {
      if (!files || files.length === 0) {
        throw new Error('No files uploaded');
      }
      
      // Get array of filenames that were saved
      const imagePaths = files.map(file => file.filename);
      
      // Update tournament with new slider image paths
      const updatedTournament = await this.tournamentService.updateSliderImages(+id, imagePaths);
      
      return {
        success: true,
        message: `${files.length} slider images uploaded successfully`,
        sliderPaths: imagePaths
      };
    } catch (error) {
      this.logger.error(`Error uploading slider images: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Error uploading slider images: ${error.message}`);
    }
  }

  // Upload PDF endpoint
  @Post(':id/pdf')
  @UseInterceptors(FileInterceptor('pdf', {
    storage: storageConfig.pdf,
    fileFilter: (req, file, cb) => {
      if (file.mimetype !== 'application/pdf') {
        return cb(new Error('Only PDF files are allowed!'), false);
      }
      
      // Check if rules PDF already exists - if it does, delete it
      const tournamentId = req.params.id;
      const filePath = path.join(publicDocumentsDir, `rules_${tournamentId}.pdf`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      cb(null, true);
    }
  }))
  async uploadRulesPdf(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    this.logger.log(`Uploading rules PDF for tournament ID: ${id}`);
    
    try {
      if (!file) {
        throw new Error('No file uploaded');
      }
      
      // Update tournament with new PDF path
      const pdfPath = file.filename;
      const updatedTournament = await this.tournamentService.updateRulesPdf(+id, pdfPath);
      
      return {
        success: true,
        message: 'Rules PDF uploaded successfully',
        pdfPath: pdfPath
      };
    } catch (error) {
      this.logger.error(`Error uploading rules PDF: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Error uploading rules PDF: ${error.message}`);
    }
  }

  // Endpoint para actualizar un torneo existente
  @Put(':id')
  async updateTournament(@Param('id') id: string, @Body() updateData: any) {
    this.logger.log(`Actualizando torneo con ID: ${id}`);
    
    try {
      const tournament = await this.tournamentService.update(+id, updateData);
      return tournament;
    } catch (error) {
      this.logger.error(`Error al actualizar torneo: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al actualizar torneo');
    }
  }
}