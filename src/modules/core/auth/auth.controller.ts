import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserService } from '../user/user.service';
import { User } from 'src/generated/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly userService :UserService) {}

  @Post('login')
  async login(@Body() authBody: LoginDto) {
    return this.authService.login(authBody);
    // return authBody;
  }

  @Post('register')
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async authenticate(@Request() req : any) {
    return req.user;
  }
}
