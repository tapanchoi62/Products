import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from '../domain/product.entity';
import { ProductImage } from '../domain/product-image.entity';
import { ProductVariant } from '../domain/product-variant.entity';
import { CreateProductDto, CreateProductImageDto, CreateProductVariantDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { FilterProductDto } from '../dto/filter-product.dto';
import { IProductRepository, PRODUCT_REPOSITORY } from '../repositories/product.repository.interface';
import { CategoryService } from '../../categories/services/category.service';
import { PaginatedResultDto } from '../../../common/dto/paginated-result.dto';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: IProductRepository,
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    private readonly categoryService: CategoryService,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const existingSku = await this.productRepo.findBySku(dto.sku);
    if (existingSku) throw new ConflictException(`Product with SKU "${dto.sku}" already exists`);

    const slug = generateSlug(dto.name);
    const existingSlug = await this.productRepo.findBySlug(slug);
    if (existingSlug) throw new ConflictException(`Product with slug "${slug}" already exists`);

    const category = dto.categoryId
      ? await this.categoryService.findById(dto.categoryId)
      : null;

    const product = this.productRepo.create({
      sku: dto.sku,
      name: dto.name,
      slug,
      shortDescription: dto.shortDescription,
      description: dto.description,
      price: dto.price,
      comparePrice: dto.comparePrice,
      costPrice: dto.costPrice,
      stock: dto.stock ?? 0,
      minStock: dto.minStock ?? 0,
      trackStock: dto.trackStock ?? true,
      status: dto.status ?? ProductStatus.DRAFT,
      isFeatured: dto.isFeatured ?? false,
      weight: dto.weight,
      dimensions: dto.dimensions,
      tags: dto.tags ?? [],
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
      category,
    });

    const saved = await this.productRepo.save(product);

    if (dto.images?.length) {
      await this.addImages(saved.id, dto.images);
    }

    if (dto.variants?.length) {
      for (const variantDto of dto.variants) {
        await this.addVariant(saved.id, variantDto);
      }
    }

    return this.productRepo.findById(saved.id);
  }

  async findAll(filter: FilterProductDto): Promise<PaginatedResultDto<Product>> {
    return this.productRepo.findAll(filter);
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepo.findBySlug(slug);
    if (!product) throw new NotFoundException(`Product with slug "${slug}" not found`);
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);

    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.productRepo.findBySku(dto.sku);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Product with SKU "${dto.sku}" already exists`);
      }
    }

    if (dto.name && dto.name !== product.name) {
      const newSlug = generateSlug(dto.name);
      const existing = await this.productRepo.findBySlug(newSlug);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Product with slug "${newSlug}" already exists`);
      }
      product.slug = newSlug;
    }

    if (dto.categoryId !== undefined) {
      product.category = dto.categoryId
        ? await this.categoryService.findById(dto.categoryId)
        : null;
    }

    Object.assign(product, {
      sku: dto.sku ?? product.sku,
      name: dto.name ?? product.name,
      shortDescription: dto.shortDescription ?? product.shortDescription,
      description: dto.description ?? product.description,
      price: dto.price ?? product.price,
      comparePrice: dto.comparePrice ?? product.comparePrice,
      costPrice: dto.costPrice ?? product.costPrice,
      stock: dto.stock ?? product.stock,
      minStock: dto.minStock ?? product.minStock,
      trackStock: dto.trackStock ?? product.trackStock,
      status: dto.status ?? product.status,
      isFeatured: dto.isFeatured ?? product.isFeatured,
      weight: dto.weight ?? product.weight,
      dimensions: dto.dimensions ?? product.dimensions,
      tags: dto.tags ?? product.tags,
      metaTitle: dto.metaTitle ?? product.metaTitle,
      metaDescription: dto.metaDescription ?? product.metaDescription,
    });

    return this.productRepo.save(product);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.productRepo.softDelete(id);
  }

  async restore(id: string): Promise<Product> {
    await this.productRepo.restore(id);
    return this.findById(id);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findById(id);
    if (product.stock + quantity < 0) {
      throw new BadRequestException('Insufficient stock');
    }
    await this.productRepo.updateStock(id, quantity);
    return this.findById(id);
  }

  async addImages(productId: string, images: CreateProductImageDto[]): Promise<Product> {
    const product = await this.findById(productId);
    const hasPrimary = images.some((img) => img.isPrimary);

    if (hasPrimary) {
      await this.imageRepo.update({ product: { id: productId } }, { isPrimary: false });
    }

    const imageEntities = images.map((img) =>
      this.imageRepo.create({ ...img, product }),
    );

    await this.imageRepo.save(imageEntities);
    return this.findById(productId);
  }

  async removeImage(imageId: string): Promise<void> {
    const image = await this.imageRepo.findOne({ where: { id: imageId } });
    if (!image) throw new NotFoundException(`Image ${imageId} not found`);
    await this.imageRepo.remove(image);
  }

  async setPrimaryImage(productId: string, imageId: string): Promise<Product> {
    await this.findById(productId);
    await this.imageRepo.update({ product: { id: productId } }, { isPrimary: false });
    await this.imageRepo.update({ id: imageId, product: { id: productId } }, { isPrimary: true });
    return this.findById(productId);
  }

  async addVariant(productId: string, dto: CreateProductVariantDto): Promise<Product> {
    const product = await this.findById(productId);

    const existing = await this.variantRepo.findOne({ where: { sku: dto.sku } });
    if (existing) throw new ConflictException(`Variant with SKU "${dto.sku}" already exists`);

    const variant = this.variantRepo.create({ ...dto, product });
    await this.variantRepo.save(variant);
    return this.findById(productId);
  }

  async updateVariant(variantId: string, dto: Partial<CreateProductVariantDto>): Promise<ProductVariant> {
    const variant = await this.variantRepo.findOne({
      where: { id: variantId },
      relations: ['product'],
    });
    if (!variant) throw new NotFoundException(`Variant ${variantId} not found`);

    if (dto.sku && dto.sku !== variant.sku) {
      const existing = await this.variantRepo.findOne({ where: { sku: dto.sku } });
      if (existing && existing.id !== variantId) {
        throw new ConflictException(`Variant with SKU "${dto.sku}" already exists`);
      }
    }

    Object.assign(variant, dto);
    return this.variantRepo.save(variant);
  }

  async removeVariant(variantId: string): Promise<void> {
    const variant = await this.variantRepo.findOne({ where: { id: variantId } });
    if (!variant) throw new NotFoundException(`Variant ${variantId} not found`);
    await this.variantRepo.remove(variant);
  }

  async updateVariantStock(variantId: string, quantity: number): Promise<ProductVariant> {
    const variant = await this.variantRepo.findOne({ where: { id: variantId } });
    if (!variant) throw new NotFoundException(`Variant ${variantId} not found`);
    if (variant.stock + quantity < 0) throw new BadRequestException('Insufficient variant stock');
    variant.stock += quantity;
    return this.variantRepo.save(variant);
  }
}
