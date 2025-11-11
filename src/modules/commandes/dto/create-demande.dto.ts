import { IsString, IsOptional, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateDemandeDto {
  @IsString()
  @IsNotEmpty()
  produitRecherche: string;

  @IsNumber()
  @Min(0.01)
  quantiteTotal: number;

  @IsNumber()
  @Min(0.01)
  prixUnitaire: number;

  @IsOptional()
  @IsString()
  territoire?: string;

   @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  messageCollecteur?: string;

}
