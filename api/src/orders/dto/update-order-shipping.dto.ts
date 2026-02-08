import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class UpdateOrderShippingDto {
  @IsOptional()
  @IsString()
  shippingCarrier?: string;

  @IsOptional()
  @IsString()
  shippingService?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @IsOptional()
  @IsISO8601()
  shippedAt?: string;

  @IsOptional()
  @IsISO8601()
  deliveredAt?: string;
}
