import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
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

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('id_token', { path: '/' });
    return { logoutUrl: this.authService.getLogoutUrl() };
  }

  @Get('identity-pool-config')
  getIdentityPoolConfig() {
    return this.authService.getIdentityPoolConfig();
  }
}
