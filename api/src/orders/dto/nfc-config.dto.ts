import { IsOptional, IsString, IsUrl } from 'class-validator';

export class NfcConfigDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  kind?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
