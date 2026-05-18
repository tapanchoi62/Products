import { Category } from '../domain/category.entity';
import { FilterCategoryDto } from '../dto/filter-category.dto';
import { PaginatedResultDto } from '../../../common/dto/paginated-result.dto';

export interface ICategoryRepository {
  create(data: Partial<Category>): Category;
  save(category: Category): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(filter: FilterCategoryDto): Promise<PaginatedResultDto<Category>>;
  findTree(): Promise<Category[]>;
  findChildren(parentId: string): Promise<Category[]>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export const CATEGORY_REPOSITORY = Symbol('ICategoryRepository');
