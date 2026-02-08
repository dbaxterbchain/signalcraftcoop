import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, ProductImageDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type ImageInput = ProductImageDto;
type ProductWithImages = Prisma.ProductGetPayload<{
  include: { images: true };
}>;

const normalizeImages = (images?: ImageInput[]) => {
  if (!images) {
    return undefined;
  }
  if (images.length === 0) {
    return [];
  }
  const normalized = images.map((image, index) => ({
    url: image.url,
    isMain: Boolean(image.isMain),
    sortOrder: image.sortOrder ?? index,
    altText: image.altText,
  }));
  const mainIndex = normalized.findIndex((image) => image.isMain);
  if (mainIndex === -1) {
    normalized[0].isMain = true;
  } else {
    normalized.forEach((image, index) => {
      if (index !== mainIndex) {
        image.isMain = false;
      }
    });
  }
  return normalized;
};

const mapProduct = (product: ProductWithImages) => ({
  id: product.id,
  title: product.title,
  sku: product.sku,
  description: product.description ?? undefined,
  basePrice: product.basePrice,
  category: product.category ?? undefined,
  allowsNfc: product.allowsNfc,
  allowsLogoUpload: product.allowsLogoUpload,
  active: product.active,
  images: product.images.map((image) => ({
    id: image.id,
    url: image.url,
    isMain: image.isMain,
    sortOrder: image.sortOrder,
    altText: image.altText ?? undefined,
  })),
  createdAt: product.createdAt.toISOString(),
});

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts() {
    const products = await this.prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    return products.map(mapProduct);
  }

  async listAllProducts() {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    return products.map(mapProduct);
  }

  async getProduct(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, active: true },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return mapProduct(product);
  }

  async createProduct(payload: CreateProductDto) {
    const images = normalizeImages(payload.images);
    const product = await this.prisma.product.create({
      data: {
        title: payload.title,
        sku: payload.sku,
        description: payload.description,
        basePrice: payload.basePrice,
        category: payload.category,
        allowsNfc: payload.allowsNfc ?? false,
        allowsLogoUpload: payload.allowsLogoUpload ?? false,
        active: true,
        images: images ? { create: images } : undefined,
      },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    return mapProduct(product);
  }

  async updateProduct(productId: string, payload: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    const images = normalizeImages(payload.images);
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        title: payload.title,
        sku: payload.sku,
        description: payload.description,
        basePrice: payload.basePrice,
        category: payload.category,
        allowsNfc: payload.allowsNfc,
        allowsLogoUpload: payload.allowsLogoUpload,
        images:
          payload.images !== undefined
            ? {
                deleteMany: {},
                create: images ?? [],
              }
            : undefined,
      },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    return mapProduct(product);
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
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    return mapProduct(product);
  }
}
