import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Role } from 'src/generated/enums';

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  nom: string;

  @IsString()
  @MinLength(1)
  prenom: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  mot_de_passe: string;

  @IsString()
  @MinLength(4)
  telephone: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsString()
  adresse?: string;
}
