import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts() {
    const products = await this.prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    return products.map((product) => ({
      id: product.id,
      title: product.title,
      sku: product.sku,
      description: product.description ?? undefined,
      basePrice: product.basePrice,
      category: product.category ?? undefined,
      allowsNfc: product.allowsNfc,
      active: product.active,
      createdAt: product.createdAt.toISOString(),
    }));
  }

  async listAllProducts() {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return products.map((product) => ({
      id: product.id,
      title: product.title,
      sku: product.sku,
      description: product.description ?? undefined,
      basePrice: product.basePrice,
      category: product.category ?? undefined,
      allowsNfc: product.allowsNfc,
      active: product.active,
      createdAt: product.createdAt.toISOString(),
    }));
  }

  async createProduct(payload: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        title: payload.title,
        sku: payload.sku,
        description: payload.description,
        basePrice: payload.basePrice,
        category: payload.category,
        allowsNfc: payload.allowsNfc,
        active: true,
      },
    });
    return {
      id: product.id,
      title: product.title,
      sku: product.sku,
      description: product.description ?? undefined,
      basePrice: product.basePrice,
      category: product.category ?? undefined,
      allowsNfc: product.allowsNfc,
      active: product.active,
      createdAt: product.createdAt.toISOString(),
    };
  }

  async updateProduct(productId: string, payload: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        title: payload.title,
        sku: payload.sku,
        description: payload.description,
        basePrice: payload.basePrice,
        category: payload.category,
        allowsNfc: payload.allowsNfc,
      },
    });
    return {
      id: product.id,
      title: product.title,
      sku: product.sku,
      description: product.description ?? undefined,
      basePrice: product.basePrice,
      category: product.category ?? undefined,
      allowsNfc: product.allowsNfc,
      active: product.active,
      createdAt: product.createdAt.toISOString(),
    };
  }

  async deactivateProduct(productId: string) {
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: { active: false },
    });
    return {
      id: product.id,
      title: product.title,
      sku: product.sku,
      description: product.description ?? undefined,
      basePrice: product.basePrice,
      category: product.category ?? undefined,
      allowsNfc: product.allowsNfc,
      active: product.active,
      createdAt: product.createdAt.toISOString(),
    };
  }
}
