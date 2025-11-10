import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Express } from 'express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileUploadInterceptor } from 'src/common/interceptors/file-upload.interceptor';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Post('avatar')
  @UseInterceptors(FileUploadInterceptor('avatar', 'avatars'))
  uploadAvatar(@UploadedFile() file: any , @Req() req ) {
    const filename = file?.filename || null;
     const userId = req.user.id; 
    const avatarUrl = filename ? `/uploads/avatars/${filename}` : null;
   const updatedUser = this.userService.updateAvatar(userId, avatarUrl);
    return updatedUser;
  }
}
