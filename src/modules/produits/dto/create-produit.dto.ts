import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsDecimal,
} from 'class-validator';
import { ProduitType, Unite, ProduitStatut } from 'generated/enums';

export class CreateProduitDto {
  @IsString()
  nom: string;

  @IsEnum(ProduitType)
  type: ProduitType;

  @IsOptional()
  @IsString()
  sousType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  quantiteDisponible: number;

  @IsEnum(Unite)
  unite: Unite;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  prixUnitaire: number;

  @IsDateString()
  @Transform(({ value }) => new Date(value).toISOString())
  dateRecolte: Date;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => new Date(value).toISOString())
  datePeremption?: Date;

  @IsOptional()
  @IsEnum(ProduitStatut)
  statut?: ProduitStatut;

  @IsOptional()
  @IsString()
  conditionsStockage?: string;

  @IsOptional()
  @IsString()
  localisation?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;
}
