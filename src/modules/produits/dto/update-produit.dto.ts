import { PartialType } from '@nestjs/mapped-types';
import { CreateProduitDto } from './create-produit.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateProduitDto extends PartialType(CreateProduitDto) {
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
