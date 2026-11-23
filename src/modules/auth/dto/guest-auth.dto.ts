
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import {messages} from "../../../messages";

/**
 * Defines the email required for guest authentication.
 */
export class GuestAuthDto {
    @ApiProperty({
        example: 'test@example.com',
        description: 'The email address used to authenticate the user.',
    })
    @IsEmail(
        {},
        {
            message: messages.auth.INVALID_EMAIL,
        },
    )
    email!: string;
}
