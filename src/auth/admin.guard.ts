// backend/src/auth/admin.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Check if the user exists and has the admin email
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    /*
    // Check if the user has the admin email
    const isAdmin = user.email === 'jfloaizaramirez@gmail.com';
    
    if (!isAdmin) {
      throw new UnauthorizedException('User is not authorized to perform this action');
    }
    */
    return true;
  }
}