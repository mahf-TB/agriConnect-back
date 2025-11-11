import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateDemandeDto {
  @IsString()
  @IsNotEmpty()
  produitRecherche: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  quantiteTotal: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  prixUnitaire: number;

  @IsOptional()
  @IsString()
  territoire?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  rayonKm?: number = 10;

  @IsOptional()
  @IsString()
  messageCollecteur?: string;

  @IsOptional()
  @IsString()
  adresseLivraison?: string;

  @IsDateString()
  @Transform(({ value }) => new Date(value).toISOString())
  dateLivraisonPrevue: Date;
}
