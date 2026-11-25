
import {
    Body,
    Controller,
    HttpStatus,
    Post,
} from '@nestjs/common';
import {
    ApiBadGatewayResponse,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GuestAuthDto } from './dto/guest-auth.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';
import {messages} from "../../messages";

/**
 * Handles application authentication endpoints.
 */
@ApiTags(messages.auth.AUTH_TAG)
@Controller('auth')
export class AuthController {
    constructor(
        private readonly auth: AuthService,
    ) {}
}
