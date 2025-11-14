import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateConversationDto {
  @IsOptional()
  @IsBoolean()
  archiveP1?: boolean;

  @IsOptional()
  @IsBoolean()
  archiveP2?: boolean;
}
