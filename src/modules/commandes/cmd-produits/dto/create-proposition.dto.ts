import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePropositionDto {
  @IsString()
  @IsNotEmpty()
  produitId: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  quantite: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  prixUnitaire?: number;

}
