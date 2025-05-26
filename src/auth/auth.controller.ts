import { Body, Controller, Post, UseGuards, Get, Request, Param } from '@nestjs/common';
import { AuthService, RegisterDto } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserGender } from '../users/user.entity';

class LoginDto {
  email: string;
  password: string;
  rememberMe: boolean;
}

class GoogleLoginDto {
  token: string;
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password, loginDto.rememberMe);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh-token')
  async refreshToken(@Request() req) {
    // El usuario ya está validado por el JwtAuthGuard
    const userId = req.user.userId;
    return this.authService.refreshToken(userId);
  }
}
