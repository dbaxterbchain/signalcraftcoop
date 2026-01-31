import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUrl, Min } from 'class-validator';
import { DesignStatus } from './design.enums';

export class CreateDesignDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  version: number;

  @IsEnum(DesignStatus)
  status: DesignStatus;

  @IsUrl()
  previewUrl: string;

  @IsOptional()
  @IsUrl()
  sourceUrl?: string;
}
