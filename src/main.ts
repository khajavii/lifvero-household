import 'reflect-metadata';

import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { HttpExceptionResponseFilter } from './common/filters/http-exception-response.filter';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    const httpAdapterHost = app.get(HttpAdapterHost);

    app.useGlobalFilters(
        new HttpExceptionResponseFilter(httpAdapterHost),
    );

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

    const swaggerCDN =
        'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14';

    SwaggerModule.setup('api/docs', app, document, {
        jsonDocumentUrl: 'api/docs-json',
        customCssUrl: `${swaggerCDN}/swagger-ui.css`,
        customJs: [
            `${swaggerCDN}/swagger-ui-bundle.js`,
            `${swaggerCDN}/swagger-ui-standalone-preset.js`,
        ],
        swaggerOptions: {
            persistAuthorization: true,
        },
        customSiteTitle: 'Lifvero Authentication API',
    });

    const port = Number(process.env.PORT) || 3000;

    await app.listen(port);

    Logger.log(`Application is running on port ${port}`);
    Logger.log('Swagger documentation: /api/docs');
    Logger.log('Swagger JSON: /api/docs-json');
}

bootstrap().catch((error: unknown) => {
    Logger.error('Application bootstrap failed', error);
    process.exit(1);
});