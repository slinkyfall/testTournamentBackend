// /backend/src/users/users.controller.ts
import { Controller, Get, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req, @Body() userData: Partial<User>) {
    // Asegurarse de que no se pueda cambiar el id o el correo electrónico desde aquí
    delete userData.id;
    delete userData.email;
    delete userData.password_hash;
    
    return this.usersService.update(req.user.userId, userData);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.usersService.remove(+id);
    return { message: 'User deleted successfully' };
  }
}