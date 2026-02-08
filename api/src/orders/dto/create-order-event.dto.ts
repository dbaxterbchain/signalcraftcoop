import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateOrderEventDto {
  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isCustomerVisible?: boolean;
}
