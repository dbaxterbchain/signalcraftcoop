import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CognitoJwtGuard } from './guards/cognito-jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './types/auth-user';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(CognitoJwtGuard)
  @Get('me')
  getMe(@CurrentUser() user?: AuthUser) {
    return this.authService.getCurrentUser(user);
  }

  @Get('identity-pool-config')
  getIdentityPoolConfig() {
    return this.authService.getIdentityPoolConfig();
  }
}
