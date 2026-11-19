
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    const config = new DocumentBuilder()
        .setTitle('Authentication API')
        .setDescription('Authentication endpoints documentation')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);

    const swaggerCDN = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14';

    SwaggerModule.setup('api/docs', app, document, {
        useGlobalPrefix: false,

        customCssUrl: [
            `${swaggerCDN}/swagger-ui.css`,
        ],

        customJs: [
            `${swaggerCDN}/swagger-ui-bundle.js`,
            `${swaggerCDN}/swagger-ui-standalone-preset.js`,
        ],

        swaggerOptions: {
            url: '/api/docs-json',
            persistAuthorization: true,
        },

        customSiteTitle: 'Lifvero Authentication API',
    });

    const port = process.env.PORT ?? 3000;
    await app.listen(port);

    Logger.log(`Application is running on port ${port}`);
    Logger.log('Swagger documentation: /api/docs');
}

bootstrap();
