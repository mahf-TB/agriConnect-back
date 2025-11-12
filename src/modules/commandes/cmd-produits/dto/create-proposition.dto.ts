import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePropositionDto {
  @IsString()
  @IsNotEmpty()
  produitId: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  quantite: number;

//   @IsNumber()
//   @IsNotEmpty()
//   @Type(() => Number)
//   prixUnitaire: number;

}
