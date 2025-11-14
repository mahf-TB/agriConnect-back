import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { MessageType } from 'generated/enums';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  expediteurId: string;

  @IsString()
  @IsNotEmpty()
  destinataireId: string;

  @IsOptional()
  @IsString()
  contenu?: string;

  @IsOptional()
  @IsEnum(MessageType)
  typeContenu?: MessageType;

  @IsOptional()
  @IsString()
  fichierUrl?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}
