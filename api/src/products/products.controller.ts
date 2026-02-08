import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  listProducts() {
    return this.productsService.listProducts();
  }

  @Get(':productId')
  getProduct(@Param('productId') productId: string) {
    return this.productsService.getProduct(productId);
  }
}
