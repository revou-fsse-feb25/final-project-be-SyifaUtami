import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enhanced CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://127.0.0.1:3000',
      'https://imajine-uni-frontend.vercel.app',
      /\.vercel\.app$/, // Allow all Vercel preview deployments
      process.env.FRONTEND_URL, // From environment variable
    ].filter(Boolean), // Remove undefined values
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept', 
      'Origin',
      'X-Requested-With',
      'Access-Control-Allow-Origin'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Application running on port ${port}`);
  console.log(`🌐 CORS enabled for production frontend`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});