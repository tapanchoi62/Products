import { Product } from '../domain/product.entity';
import { FilterProductDto } from '../dto/filter-product.dto';
import { PaginatedResultDto } from '../../../common/dto/paginated-result.dto';

export interface IProductRepository {
  create(data: Partial<Product>): Product;
  save(product: Product): Promise<Product>;
  findById(id: string, relations?: string[]): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findAll(filter: FilterProductDto): Promise<PaginatedResultDto<Product>>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  updateStock(id: string, quantity: number): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol('IProductRepository');
