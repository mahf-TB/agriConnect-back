import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, IsDecimal } from 'class-validator';
import { ProduitType , Unite, ProduitStatut} from 'src/generated/enums';


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
  quantiteDisponible: number;

  @IsEnum(Unite)
  unite: Unite;

  @IsNumber({ maxDecimalPlaces: 2 })
  prixUnitaire: number;

  @IsDateString()
  dateRecolte: Date;

  @IsOptional()
  @IsDateString()
  datePeremption?: Date;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsEnum(ProduitStatut)
  statut?: ProduitStatut;

  @IsOptional()
  @IsString()
  conditionsStockage?: string;

  @IsString()
  paysanId: string;
}
