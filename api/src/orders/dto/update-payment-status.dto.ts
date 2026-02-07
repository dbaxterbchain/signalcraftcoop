import { IsEnum } from 'class-validator';
import { PaymentStatus } from './order.enums';

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  status: PaymentStatus;
}
