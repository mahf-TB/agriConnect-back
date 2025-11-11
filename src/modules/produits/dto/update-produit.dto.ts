import { PartialType } from '@nestjs/mapped-types';
import { CreateProduitDto } from './create-produit.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ProduitStatut } from 'generated/enums';

export class UpdateProduitDto extends PartialType(CreateProduitDto) {}
