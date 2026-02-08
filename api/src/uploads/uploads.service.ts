import { InternalServerErrorException, Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';

const SAFE_FILE_NAME = /[^a-zA-Z0-9._-]/g;

@Injectable()
export class UploadsService {
  private readonly bucket = process.env.UPLOADS_BUCKET ?? '';
  private readonly baseUrl = process.env.UPLOADS_PUBLIC_BASE_URL ?? '';
  private readonly prefix = process.env.UPLOADS_PREFIX ?? 'designs';
  private readonly region =
    process.env.AWS_REGION?.trim() ||
    process.env.AWS_DEFAULT_REGION?.trim() ||
    process.env.COGNITO_REGION?.trim() ||
    'us-west-2';
  private readonly s3 = new S3Client({ region: this.region });

  async createPresignedUrl(payload: CreateUploadUrlDto) {
    if (!this.bucket || !this.baseUrl) {
      throw new InternalServerErrorException('Uploads bucket not configured');
    }

    const safeName = payload.fileName.replace(SAFE_FILE_NAME, '-');
    const orderSegment = payload.orderId ? payload.orderId : 'general';
    const key = [
      this.prefix,
      orderSegment,
      payload.category,
      `${Date.now()}-${randomUUID()}-${safeName}`,
    ].join('/');

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: payload.contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });

    return {
      uploadUrl,
      fileUrl: `${this.baseUrl}/${key}`,
      key,
    };
  }
}
