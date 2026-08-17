import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module.js';
import { ResponseInterceptor } from './response.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: { origin: ' * ' } });
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
