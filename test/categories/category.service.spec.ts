import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoryService } from '../../src/modules/categories/services/category.service';
import { CATEGORY_REPOSITORY } from '../../src/modules/categories/repositories/category.repository.interface';
import { CreateCategoryDto } from '../../src/modules/categories/dto/create-category.dto';

const mockCategoryRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findAll: jest.fn(),
  findTree: jest.fn(),
  findChildren: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
  exists: jest.fn(),
};

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: CATEGORY_REPOSITORY, useValue: mockCategoryRepo },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto: CreateCategoryDto = { name: 'Electronics' };

    it('should create a category successfully', async () => {
      const mockCategory = { id: 'uuid-1', name: 'Electronics', slug: 'electronics' };
      mockCategoryRepo.findBySlug.mockResolvedValue(null);
      mockCategoryRepo.create.mockReturnValue(mockCategory);
      mockCategoryRepo.save.mockResolvedValue(mockCategory);

      const result = await service.create(dto);
      expect(result).toEqual(mockCategory);
      expect(mockCategoryRepo.findBySlug).toHaveBeenCalledWith('electronics');
    });

    it('should throw ConflictException when slug already exists', async () => {
      mockCategoryRepo.findBySlug.mockResolvedValue({ id: 'existing' });
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when parent not found', async () => {
      mockCategoryRepo.findBySlug.mockResolvedValue(null);
      mockCategoryRepo.findById.mockResolvedValue(null);
      const dtoWithParent = { ...dto, parentId: 'non-existent-parent' };
      await expect(service.create(dtoWithParent)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return category when found', async () => {
      const mockCategory = { id: 'uuid-1', name: 'Electronics' };
      mockCategoryRepo.findById.mockResolvedValue(mockCategory);
      const result = await service.findById('uuid-1');
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when not found', async () => {
      mockCategoryRepo.findById.mockResolvedValue(null);
      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete category without children', async () => {
      mockCategoryRepo.findById.mockResolvedValue({ id: 'uuid-1' });
      mockCategoryRepo.findChildren.mockResolvedValue([{ id: 'uuid-1' }]);
      mockCategoryRepo.softDelete.mockResolvedValue(undefined);

      await service.remove('uuid-1');
      expect(mockCategoryRepo.softDelete).toHaveBeenCalledWith('uuid-1');
    });

    it('should throw BadRequestException when category has subcategories', async () => {
      mockCategoryRepo.findById.mockResolvedValue({ id: 'uuid-1' });
      mockCategoryRepo.findChildren.mockResolvedValue([
        { id: 'uuid-1' },
        { id: 'child-1' },
        { id: 'child-2' },
      ]);
      await expect(service.remove('uuid-1')).rejects.toThrow();
    });
  });

  describe('findTree', () => {
    it('should return category tree', async () => {
      const mockTree = [{ id: 'uuid-1', children: [] }];
      mockCategoryRepo.findTree.mockResolvedValue(mockTree);
      const result = await service.findTree();
      expect(result).toEqual(mockTree);
    });
  });
});
