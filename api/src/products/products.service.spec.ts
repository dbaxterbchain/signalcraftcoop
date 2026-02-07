import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

describe('ProductsService', () => {
  const createdAt = new Date('2024-01-01T00:00:00.000Z');

  type ProductRecord = {
    id: string;
    title: string;
    sku: string;
    description: string | null;
    basePrice: number;
    category: string | null;
    allowsNfc: boolean;
    active: boolean;
    createdAt: Date;
  };

  type ProductDelegateMock = {
    findMany: jest.Mock<Promise<ProductRecord[]>, [Prisma.ProductFindManyArgs]>;
    create: jest.Mock<Promise<ProductRecord>, [Prisma.ProductCreateArgs]>;
    update: jest.Mock<Promise<ProductRecord>, [Prisma.ProductUpdateArgs]>;
    findUnique: jest.Mock<
      Promise<ProductRecord | null>,
      [Prisma.ProductFindUniqueArgs]
    >;
  };

  type PrismaMock = {
    product: ProductDelegateMock;
  };

  const makeProduct = (
    overrides: Partial<ProductRecord> = {},
  ): ProductRecord => ({
    id: 'prod_1',
    title: 'Keychain',
    sku: 'KEY-1',
    description: 'Test product',
    basePrice: 12,
    category: 'merch',
    allowsNfc: true,
    active: true,
    createdAt,
    ...overrides,
  });

  const createService = () => {
    const prisma: PrismaMock = {
      product: {
        findMany: jest.fn<
          Promise<ProductRecord[]>,
          [Prisma.ProductFindManyArgs]
        >(),
        create: jest.fn<Promise<ProductRecord>, [Prisma.ProductCreateArgs]>(),
        update: jest.fn<Promise<ProductRecord>, [Prisma.ProductUpdateArgs]>(),
        findUnique: jest.fn<
          Promise<ProductRecord | null>,
          [Prisma.ProductFindUniqueArgs]
        >(),
      },
    };
    const service = new ProductsService(prisma as unknown as PrismaService);
    return { prisma, service };
  };

  it('lists active products', async () => {
    const { prisma, service } = createService();
    const product = makeProduct();
    prisma.product.findMany.mockResolvedValue([product]);

    const result = await service.listProducts();

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([
      {
        id: product.id,
        title: product.title,
        sku: product.sku,
        description: product.description,
        basePrice: product.basePrice,
        category: product.category,
        allowsNfc: product.allowsNfc,
        active: product.active,
        createdAt: product.createdAt.toISOString(),
      },
    ]);
  });

  it('lists all products', async () => {
    const { prisma, service } = createService();
    const product = makeProduct({ active: false });
    prisma.product.findMany.mockResolvedValue([product]);

    const result = await service.listAllProducts();

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
    expect(result[0].active).toBe(false);
  });

  it('creates a product', async () => {
    const { prisma, service } = createService();
    const product = makeProduct();
    prisma.product.create.mockResolvedValue(product);

    const payload: CreateProductDto = {
      title: product.title,
      sku: product.sku,
      description: product.description ?? undefined,
      basePrice: product.basePrice,
      category: product.category ?? undefined,
      allowsNfc: product.allowsNfc,
    };

    const result = await service.createProduct(payload);

    expect(prisma.product.create).toHaveBeenCalledWith({
      data: {
        title: product.title,
        sku: product.sku,
        description: product.description,
        basePrice: product.basePrice,
        category: product.category,
        allowsNfc: product.allowsNfc,
        active: true,
      },
    });
    expect(result.id).toBe(product.id);
  });

  it('updates a product', async () => {
    const { prisma, service } = createService();
    const product = makeProduct();
    prisma.product.findUnique.mockResolvedValue(product);
    prisma.product.update.mockResolvedValue({ ...product, title: 'Updated' });

    const payload: UpdateProductDto = {
      title: 'Updated',
      sku: product.sku,
      description: product.description ?? undefined,
      basePrice: product.basePrice,
      category: product.category ?? undefined,
      allowsNfc: product.allowsNfc,
    };

    const result = await service.updateProduct(product.id, payload);

    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: product.id },
    });
    expect(result.title).toBe('Updated');
  });

  it('throws when updating missing product', async () => {
    const { prisma, service } = createService();
    prisma.product.findUnique.mockResolvedValue(null);

    const payload: UpdateProductDto = {
      title: 'Updated',
      sku: 'SKU',
      description: 'desc',
      basePrice: 10,
      category: 'cat',
      allowsNfc: false,
    };

    await expect(
      service.updateProduct('missing', payload),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deactivates a product', async () => {
    const { prisma, service } = createService();
    const product = makeProduct();
    prisma.product.findUnique.mockResolvedValue(product);
    prisma.product.update.mockResolvedValue({ ...product, active: false });

    const result = await service.deactivateProduct(product.id);

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: product.id },
      data: { active: false },
    });
    expect(result.active).toBe(false);
  });

  it('throws when deactivating missing product', async () => {
    const { prisma, service } = createService();
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(service.deactivateProduct('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
