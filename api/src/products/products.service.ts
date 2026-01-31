import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type ProductRecord = {
  id: string;
  title: string;
  sku: string;
  description?: string | null;
  basePrice: number;
  category?: string | null;
  allowsNfc: boolean;
  active: boolean;
  createdAt: string;
};

@Injectable()
export class ProductsService {
  private products: ProductRecord[] = [
    {
      id: 'prod_1',
      title: 'Logo Keychain (NFC)',
      sku: 'KEY-NFC-01',
      description: 'Acrylic keychain with embedded NFC.',
      basePrice: 6,
      category: 'keychains',
      allowsNfc: true,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_2',
      title: 'Laser-Engraved Coaster Set',
      sku: 'COASTER-ENG-01',
      description: 'Set of 4 engraved coasters.',
      basePrice: 22,
      category: 'engraving',
      allowsNfc: false,
      active: true,
      createdAt: new Date().toISOString(),
    },
  ];

  listProducts() {
    return this.products.filter((product) => product.active);
  }

  listAllProducts() {
    return [...this.products];
  }

  createProduct(payload: CreateProductDto) {
    const id = `prod_${this.products.length + 1}`;
    const product = {
      id,
      title: payload.title,
      sku: payload.sku,
      description: payload.description ?? null,
      basePrice: payload.basePrice,
      category: payload.category ?? null,
      allowsNfc: payload.allowsNfc,
      active: true,
      createdAt: new Date().toISOString(),
    };
    this.products.unshift(product);
    return product;
  }

  updateProduct(productId: string, payload: UpdateProductDto) {
    const product = this.products.find((item) => item.id === productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    Object.assign(product, {
      title: payload.title ?? product.title,
      sku: payload.sku ?? product.sku,
      description: payload.description ?? product.description,
      basePrice: payload.basePrice ?? product.basePrice,
      category: payload.category ?? product.category,
      allowsNfc: payload.allowsNfc ?? product.allowsNfc,
    });
    return product;
  }

  deactivateProduct(productId: string) {
    const product = this.products.find((item) => item.id === productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    product.active = false;
    return product;
  }
}
