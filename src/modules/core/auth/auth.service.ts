import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { comparePassword } from 'src/common/utils/password.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}
  async login(data: LoginDto) {
    // Find user by email and validate password
    const user = await this.validateUser(data.email, data.password);
    // Generate JWT token
    return this.authenticateUser(user);
  }

  async register(data: RegisterDto) {
    const user = await this.userService.findByEmail(data.email);
    if (user) throw new UnauthorizedException('Email already in use');
    const newUser = this.userService.create(data);
    return this.authenticateUser(newUser);
  }

  private async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await comparePassword(password, user.mot_de_passe);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  private authenticateUser(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: payload,
    };
  }
}
