import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { NotificationType } from 'generated/enums';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  titre: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  lien?: string;

  @IsOptional()
  reference_id?: string;

  @IsOptional()
  @IsString()
  reference_type?: string;

  @IsArray()
  @IsNotEmpty({ each: true })
  userIds: string[]; // Liste des utilisateurs à notifier
}
