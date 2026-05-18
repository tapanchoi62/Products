import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './domain/product.entity';
import { ProductImage } from './domain/product-image.entity';
import { ProductVariant } from './domain/product-variant.entity';
import { ProductRepository } from './repositories/product.repository';
import { PRODUCT_REPOSITORY } from './repositories/product.repository.interface';
import { ProductService } from './services/product.service';
import { ProductController } from './controllers/product.controller';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage, ProductVariant]),
    CategoriesModule,
  ],
  controllers: [ProductController],
  providers: [
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductRepository,
    },
    ProductService,
  ],
  exports: [ProductService],
})
export class ProductsModule {}
