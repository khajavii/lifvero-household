
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

    /**
     * Authenticates or registers a user using their email address.
     *
     * @param body - The user's email address.
     * @returns The access token, user ID, and registration status.
     */
    @Post('login-or-register')
    @ApiOperation({
        summary: messages.auth.LOGIN_OR_REGISTER,
        description: messages.auth.LOGIN_OR_REGISTER_DESCRIPTION,
    })
    @ApiBody({
        type: GuestAuthDto,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: messages.auth.AUTHENTICATION_SUCCESSFUL,
    })
    @ApiUnauthorizedResponse({
        description: messages.auth.INVALID_RETURNED_ACCESS_TOKEN,
    })
    @ApiBadGatewayResponse({
        description: messages.auth.AUTH_SERVICE_REQUEST_FAILED,
    })
    async loginOrRegister(
        @Body() body: GuestAuthDto,
    ) {
        const result = await this.auth.loginOrRegister(body);

        return ResponseHelper.success(
            {
                accessToken: result.accessToken,
                isNewUser: result.isNewUser,
                userId: result.userId,
            },
            messages.auth.AUTHENTICATION_SUCCESSFUL,
            HttpStatus.OK,
        );
    }
}
