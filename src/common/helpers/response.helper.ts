import { HttpException, HttpStatus } from '@nestjs/common';

export class ResponseHelper {
    /**
     * Handles successful JSON responses.
     */
    static success<T = any>(
        data: T | null = null,
        message: string | null = null,
        status: number = HttpStatus.OK,
    ) {
        return {
            success: true,
            message,
            data,
            status,
        };
    }

    /**
     * Handles error responses.
     */
    static error<T = any>(
        message: string,
        code: number = HttpStatus.BAD_REQUEST,
        data: T | null = null,
        codeManual?: number,
    ): never {
        throw new HttpException(
            {
                error: true,
                message,
                data,
                status: codeManual ?? code,
            },
            code,
        );
    }

    /**
     * Returns a raw JSON response.
     */
    static responseJsonManual<T = any>(
        data: T | null = null,
    ): T | null {
        return data;
    }
}