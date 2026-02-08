import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CognitoJwtGuard } from '../auth/guards/cognito-jwt.guard';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { UploadsService } from './uploads.service';

@UseGuards(CognitoJwtGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  createUploadUrl(@Body() payload: CreateUploadUrlDto) {
    return this.uploadsService.createPresignedUrl(payload);
  }
}
