import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import { Category } from '../domain/category.entity';
import { ICategoryRepository } from './category.repository.interface';
import { FilterCategoryDto } from '../dto/filter-category.dto';
import { PaginatedResultDto } from '../../../common/dto/paginated-result.dto';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repo: TreeRepository<Category>,
  ) {}

  create(data: Partial<Category>): Category {
    return this.repo.create(data);
  }

  save(category: Category): Promise<Category> {
    return this.repo.save(category);
  }

  async findById(id: string): Promise<Category | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.repo.findOne({ where: { slug }, relations: ['parent'] });
  }

  async findAll(filter: FilterCategoryDto): Promise<PaginatedResultDto<Category>> {
    const { page = 1, limit = 20, search, parentId, isActive, sortBy = 'sortOrder', sortOrder = 'ASC' } = filter;

    const qb = this.repo
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .where('category.deleted_at IS NULL');

    if (search) {
      qb.andWhere('(category.name ILIKE :search OR category.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (parentId !== undefined) {
      if (parentId === null) {
        qb.andWhere('category.parent IS NULL');
      } else {
        qb.andWhere('parent.id = :parentId', { parentId });
      }
    }

    if (isActive !== undefined) {
      qb.andWhere('category.is_active = :isActive', { isActive });
    }

    const validSortFields = ['name', 'sortOrder', 'createdAt', 'updatedAt'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'sortOrder';
    qb.orderBy(`category.${orderField}`, sortOrder as 'ASC' | 'DESC');

    const total = await qb.getCount();
    qb.skip((page - 1) * limit).take(limit);
    const data = await qb.getMany();

    return PaginatedResultDto.create(data, total, page, limit);
  }

  async findTree(): Promise<Category[]> {
    return this.repo.findTrees({ relations: ['children'] });
  }

  async findChildren(parentId: string): Promise<Category[]> {
    const parent = await this.repo.findOne({ where: { id: parentId } });
    if (!parent) return [];
    return this.repo.findDescendants(parent);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repo.restore(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repo.count({ where: { id } });
    return count > 0;
  }
}
