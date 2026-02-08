import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsObject,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { NfcConfigDto } from './nfc-config.dto';

export class OrderItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  quantity: number;

  @IsPositive()
  @Type(() => Number)
  unitPrice: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => NfcConfigDto)
  nfcConfig?: NfcConfigDto;

  @IsOptional()
  @IsString()
  designId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
