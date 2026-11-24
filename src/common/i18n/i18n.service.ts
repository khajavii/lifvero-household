import { Injectable } from '@nestjs/common';
import { Messages, Language } from '../../messages';

@Injectable()
export class I18nService {
    /**
     * Resolves the requested language.
     *
     * @param acceptLanguage - The Accept-Language header.
     * @returns The supported language.
     */
    resolveLanguage(acceptLanguage?: string): Language {
        const language = acceptLanguage
            ?.split(',')[0]
            ?.split('-')[0]
            ?.trim()
            ?.toLowerCase();

        return language && language in Messages
            ? language as Language
            : 'en';
    }

    /**
     * Retrieves a localized message.
     *
     * @param language - The requested language.
     * @param key - The message namespace.
     * @returns The localized messages.
     */
    getMessages(language: Language) {
        return Messages[language];
    }
}