import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUploadUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsIn(['preview', 'source', 'review', 'product', 'logo'])
  category!: 'preview' | 'source' | 'review' | 'product' | 'logo';
}
