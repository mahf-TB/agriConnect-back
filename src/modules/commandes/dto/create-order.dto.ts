import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateOrderDto {
  @IsOptional()
  @IsNumber()
   @Type(() => Number)
  quantiteAccordee: number;

  @IsOptional()
  @IsNumber()
   @Type(() => Number)
  prixUnitaire?: number;

  @IsOptional()
  @IsString()
  adresseLivraison?: string;

  @IsDateString()
  @Transform(({ value }) => new Date(value).toISOString())
  dateLivraisonPrevue: Date;

  @IsOptional()
  @IsString()
  messageCollecteur?: string;

  @IsOptional()
  @IsString()
  produitId: string;

  @IsOptional()
  @IsString()
  paysanId: string;
}
