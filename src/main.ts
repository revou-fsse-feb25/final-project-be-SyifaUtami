// Debug CORS - Add this to your main.ts temporarily
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 🔍 DEBUG: Log CORS configuration
  console.log('🌐 Setting up CORS...');
  console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
  console.log('🔧 PORT:', process.env.PORT);
  
  app.enableCors({
    origin: [
      'http://localhost:3000',  // Local development
      'http://localhost:3001',  // Local development alt
      'http://127.0.0.1:3000',
      'https://imajine-uni-frontend.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
    credentials: true,
    // 🔍 DEBUG: Log CORS requests
    optionsSuccessStatus: 200,
  });
  
  console.log('✅ CORS configured for:', [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://127.0.0.1:3000'
  ]);

  // 🔍 DEBUG: Add request logging middleware
  app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url} from origin: ${req.headers.origin || 'no-origin'}`);
    next();
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Application is running on port ${port}`);
  console.log(`🌐 CORS should allow: http://localhost:3000`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});