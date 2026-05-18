import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../domain/product.entity';
import { IProductRepository } from './product.repository.interface';
import { FilterProductDto } from '../dto/filter-product.dto';
import { PaginatedResultDto } from '../../../common/dto/paginated-result.dto';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  create(data: Partial<Product>): Product {
    return this.repo.create(data);
  }

  save(product: Product): Promise<Product> {
    return this.repo.save(product);
  }

  async findById(id: string, relations: string[] = ['category', 'images', 'variants']): Promise<Product | null> {
    return this.repo.findOne({ where: { id }, relations });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { slug },
      relations: ['category', 'images', 'variants'],
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.repo.findOne({ where: { sku } });
  }

  async findAll(filter: FilterProductDto): Promise<PaginatedResultDto<Product>> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      categoryId,
      minPrice,
      maxPrice,
      isFeatured,
      lowStock,
      tag,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filter;

    const qb = this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.deleted_at IS NULL');

    if (search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere('product.status = :status', { status });
    }

    if (categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId });
    }

    if (minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (isFeatured !== undefined) {
      qb.andWhere('product.is_featured = :isFeatured', { isFeatured });
    }

    if (lowStock) {
      qb.andWhere('product.track_stock = true AND product.stock <= product.min_stock');
    }

    if (tag) {
      qb.andWhere(':tag = ANY(string_to_array(product.tags, \',\'))', { tag });
    }

    const validSortFields: Record<string, string> = {
      name: 'product.name',
      price: 'product.price',
      stock: 'product.stock',
      createdAt: 'product.createdAt',
      updatedAt: 'product.updatedAt',
    };

    const orderField = validSortFields[sortBy] ?? 'product.created_at';
    qb.orderBy(orderField, sortOrder as 'ASC' | 'DESC');

    const total = await qb.getCount();
    qb.skip((page - 1) * limit).take(limit);
    const data = await qb.getMany();

    return PaginatedResultDto.create(data, total, page, limit);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repo.restore(id);
  }

  async updateStock(id: string, quantity: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(Product)
      .set({ stock: () => `stock + ${quantity}` })
      .where('id = :id', { id })
      .execute();
  }
}
