// src/config/multer.config.ts
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Asegúrate de que el directorio existe
const ensureDirectoryExists = (directory: string) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`Directorio creado: ${directory}`);
  }
};

export const multerStorage = (destination: string) => {
  // Asegúrate de que el directorio existe
  ensureDirectoryExists(destination);
  
  return diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      // Generar un nombre único para el archivo
      const uniqueFilename = `${uuidv4()}${extname(file.originalname)}`;
      cb(null, uniqueFilename);
    },
  });
};