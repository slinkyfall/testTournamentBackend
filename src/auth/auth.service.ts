import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User, UserGender } from '../users/user.entity';

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  second_last_name: string;
  birth_date: Date;
  age: number; // Nuevo campo de edad
  curp: string; // Se almacenará en mayúsculas
  gender: UserGender;
  custom_gender?: string;
  state: string;
  municipality: string;
  postal_code: string;
  phone: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerData: RegisterDto): Promise<any> {
    // Verificar si el usuario ya existe por email o username
    const existingUserByEmail = await this.usersService.findByEmail(registerData.email);
    if (existingUserByEmail) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const existingUserByUsername = await this.usersService.findByUsername(registerData.username);
    if (existingUserByUsername) {
      throw new ConflictException('El nombre de usuario ya está registrado');
    }

    // Verificar si el CURP ya existe
    // Convertir siempre a mayúsculas
    registerData.curp = registerData.curp.toUpperCase();
    const existingUserByCurp = await this.usersService.findByCurp(registerData.curp);
    if (existingUserByCurp) {
      throw new ConflictException('El CURP ya está registrado');
    }


    // Hash de la contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(registerData.password, saltRounds);

    // Crear el usuario
    const userData: Partial<User> = {
      ...registerData,
      password_hash,
      curp: registerData.curp.toUpperCase(), // Asegurar que CURP esté en mayúsculas
    };

    const user = await this.usersService.create(userData);

    // Aquí iría la lógica para enviar correos de verificación
    // await this.sendVerificationEmail(user.email);
    
    return {
      message: 'Usuario registrado correctamente. Por favor verifica tu correo electrónico.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
      },
    };
  }

 

  async login(email: string, password: string, rememberMe: boolean): Promise<any> {
    // Buscar el usuario por email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Actualizar última vez de inicio de sesión
    await this.usersService.updateLastLogin(user.id);

    // Generar JWT
    const payload = { 
      sub: user.id, 
      username: user.username, 
      email: user.email,
      first_name: user.first_name
    };
    const expiresIn = rememberMe ? '7d' : '1d'; // 7 días si "rememberMe" está activado, 1 día si no
    
    return {
      token: this.jwtService.sign(payload, { expiresIn }),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
      },
    };
  }

  async validateUser(payload: any): Promise<any> {
    const user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return user;
  }

  // Método para calcular la edad a partir de una fecha de nacimiento
  calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
    
  async loginWithGoogle(googleId: string, email: string, firstName: string, lastName: string): Promise<any> {
    // Buscar usuario por googleId o email
    let user = await this.usersService.findByGoogleId(googleId);
    
    if (!user) {
      user = await this.usersService.findByEmail(email);
      
      if (user) {
        // Actualizar el usuario existente con el googleId
        user = await this.usersService.update(user.id, { google_id: googleId });
      } else {
        // Crear un nuevo usuario con datos mínimos
        // En un escenario real, podrías redirigir a un formulario para completar los datos faltantes
        const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
        const dummyBirthDate = new Date();
        const age = 0; // Valor predeterminado
        
        const userData: Partial<User> = {
          username,
          email,
          password_hash: await bcrypt.hash(Math.random().toString(36), 10),
          first_name: firstName,
          last_name: lastName,
          second_last_name: '', // Campo requerido, valor por defecto
          birth_date: dummyBirthDate, // Campo requerido, valor por defecto
          age: age, // Nuevo campo de edad
          curp: `TEMP${Math.random().toString(36).substring(2, 10).toUpperCase()}`, // Valor temporal
          gender: UserGender.NOT_SPECIFIED,
          state: 'No especificado',
          municipality: 'No especificado',
          postal_code: '00000',
          phone: '0000000000', // Valor temporal
          google_id: googleId,
          email_verified: true, // El email ya está verificado por Google
        };
        
        user = await this.usersService.create(userData);
      }
    }

    
    // Actualizar última vez de inicio de sesión
    await this.usersService.updateLastLogin(user.id);

    // Generar JWT
    const payload = { 
      sub: user.id, 
      username: user.username, 
      email: user.email,
      first_name: user.first_name
    };
    
    return {
      token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
      },
      needsProfileCompletion: !user.curp || user.curp.startsWith('TEMP'), // Indicar si necesita completar su perfil
    };
  }

  async refreshToken(userId: number): Promise<any> {
    // Buscar el usuario por ID
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    
    // Actualizar última vez de inicio de sesión
    await this.usersService.updateLastLogin(user.id);
    
    // Generar un nuevo JWT
    const payload = { 
      sub: user.id, 
      username: user.username, 
      email: user.email,
      first_name: user.first_name
    };
    
    return {
      token: this.jwtService.sign(payload, { expiresIn: '1d' }),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
      }
    };
  }
}