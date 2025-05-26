// /backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Añadir todos los niveles
    });
    
    
    // Configuración de CORS
    app.enableCors({
      origin: 'http://localhost:4200', // URL de tu frontend Angular
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: 'Content-Type,Accept,Authorization',
    });
    
    // Captura de errores no manejados
    process.on('unhandledRejection', (reason, promise) => {
      logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    });

    process.on('uncaughtException', (error) => {
      logger.error(`Uncaught Exception: ${error.message}`, error.stack);
    });
    
    await app.listen(process.env.PORT ?? 3000);
    logger.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    logger.error(`Error starting application: ${error.message}`, error.stack);
    process.exit(1);
  }

  
}
bootstrap();

