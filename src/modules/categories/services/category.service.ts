import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category } from '../domain/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { FilterCategoryDto } from '../dto/filter-category.dto';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../repositories/category.repository.interface';
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
export class CategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = generateSlug(dto.name);
    const existing = await this.categoryRepo.findBySlug(slug);
    if (existing) throw new ConflictException(`Category with slug "${slug}" already exists`);

    let parent: Category | null = null;
    if (dto.parentId) {
      parent = await this.categoryRepo.findById(dto.parentId);
      if (!parent) throw new NotFoundException(`Parent category ${dto.parentId} not found`);
    }

    const category = this.categoryRepo.create({
      name: dto.name,
      slug,
      description: dto.description,
      imageUrl: dto.imageUrl,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
      parent,
    });

    return this.categoryRepo.save(category);
  }

  async findAll(filter: FilterCategoryDto): Promise<PaginatedResultDto<Category>> {
    return this.categoryRepo.findAll(filter);
  }

  async findTree(): Promise<Category[]> {
    return this.categoryRepo.findTree();
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoryRepo.findById(id);
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepo.findBySlug(slug);
    if (!category) throw new NotFoundException(`Category with slug "${slug}" not found`);
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);

    if (dto.name && dto.name !== category.name) {
      const newSlug = generateSlug(dto.name);
      const existing = await this.categoryRepo.findBySlug(newSlug);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Category with slug "${newSlug}" already exists`);
      }
      category.slug = newSlug;
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) throw new BadRequestException('Category cannot be its own parent');
      if (dto.parentId) {
        const parent = await this.categoryRepo.findById(dto.parentId);
        if (!parent) throw new NotFoundException(`Parent category ${dto.parentId} not found`);
        category.parent = parent;
      } else {
        category.parent = null;
      }
    }

    Object.assign(category, {
      name: dto.name ?? category.name,
      description: dto.description ?? category.description,
      imageUrl: dto.imageUrl ?? category.imageUrl,
      sortOrder: dto.sortOrder ?? category.sortOrder,
      isActive: dto.isActive ?? category.isActive,
      metaTitle: dto.metaTitle ?? category.metaTitle,
      metaDescription: dto.metaDescription ?? category.metaDescription,
    });

    return this.categoryRepo.save(category);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    const children = await this.categoryRepo.findChildren(id);
    if (children.length > 1) {
      throw new BadRequestException('Cannot delete category that has subcategories');
    }
    await this.categoryRepo.softDelete(id);
  }

  async restore(id: string): Promise<Category> {
    await this.categoryRepo.restore(id);
    return this.findById(id);
  }
}
