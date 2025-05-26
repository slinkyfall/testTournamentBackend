
// Primero, crea este archivo: src/types/express.d.ts
// Este archivo extenderá el tipo Request para incluir fileIndex
declare namespace Express {
    interface Request {
      fileIndex?: number;
    }
  }
  