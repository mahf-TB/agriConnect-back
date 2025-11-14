import {
  IsString,
  IsNotEmpty,
} from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  participant1Id: string;

  @IsString()
  @IsNotEmpty()
  participant2Id: string;
}
