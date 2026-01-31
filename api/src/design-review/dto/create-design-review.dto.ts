import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { DesignReviewStatus } from './design.enums';

export class CreateDesignReviewDto {
  @IsEnum(DesignReviewStatus)
  status: DesignReviewStatus;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsUrl()
  attachmentUrl?: string;
}
