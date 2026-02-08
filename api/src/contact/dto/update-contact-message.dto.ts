import { IsEnum } from 'class-validator';
import { ContactStatus } from '@prisma/client';

export class UpdateContactMessageDto {
  @IsEnum(ContactStatus)
  status: ContactStatus;
}
