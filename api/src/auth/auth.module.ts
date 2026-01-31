import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CognitoJwtGuard } from './guards/cognito-jwt.guard';
import { RolesGuard } from './guards/roles.guard';
import { CognitoJwtStrategy } from './strategies/cognito-jwt.strategy';

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [AuthService, CognitoJwtGuard, CognitoJwtStrategy, RolesGuard],
  exports: [CognitoJwtGuard, RolesGuard],
})
export class AuthModule {}
