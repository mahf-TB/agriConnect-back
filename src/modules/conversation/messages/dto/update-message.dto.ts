import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { MessageType } from 'generated/enums';

export class UpdateMessageDto {
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
  @IsBoolean()
  lu?: boolean;
}
