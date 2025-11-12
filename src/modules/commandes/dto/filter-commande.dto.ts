import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator'; // si tu veux typer le statut
import { CommandeStatut } from 'generated/enums';

export class FilterCommandeDto {
  @IsOptional()
  @IsEnum(CommandeStatut)
  statut?: CommandeStatut;

  @IsOptional()
  @IsString()
  produitRecherche?: string;

  @IsOptional()
  @IsString()
  territoire?: string;

  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string;
}
