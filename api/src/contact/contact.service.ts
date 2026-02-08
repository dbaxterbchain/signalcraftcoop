import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { UpdateContactMessageDto } from './dto/update-contact-message.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  createMessage(payload: CreateContactMessageDto) {
    return this.prisma.contactMessage.create({
      data: {
        name: payload.name,
        email: payload.email,
        subject: payload.subject,
        message: payload.message,
      },
    });
  }

  listMessages() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  updateMessage(messageId: string, payload: UpdateContactMessageDto) {
    return this.prisma.contactMessage.update({
      where: { id: messageId },
      data: { status: payload.status },
    });
  }
}
