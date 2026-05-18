import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductService } from '../../src/modules/products/services/product.service';
import { Product, ProductStatus } from '../../src/modules/products/domain/product.entity';
import { ProductImage } from '../../src/modules/products/domain/product-image.entity';
import { ProductVariant } from '../../src/modules/products/domain/product-variant.entity';
import { PRODUCT_REPOSITORY } from '../../src/modules/products/repositories/product.repository.interface';
import { CategoryService } from '../../src/modules/categories/services/category.service';
import { CreateProductDto } from '../../src/modules/products/dto/create-product.dto';

const mockProductRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findBySku: jest.fn(),
  findAll: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
  updateStock: jest.fn(),
};

const mockImageRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockVariantRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
};

const mockCategoryService = {
  findById: jest.fn(),
};

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepo },
        { provide: getRepositoryToken(ProductImage), useValue: mockImageRepo },
        { provide: getRepositoryToken(ProductVariant), useValue: mockVariantRepo },
        { provide: CategoryService, useValue: mockCategoryService },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto: CreateProductDto = {
      sku: 'TEST-001',
      name: 'Test Product',
      price: 99.99,
    };

    it('should create a product successfully', async () => {
      const mockProduct = { id: 'uuid-1', ...dto, slug: 'test-product', status: ProductStatus.DRAFT };
      mockProductRepo.findBySku.mockResolvedValue(null);
      mockProductRepo.findBySlug.mockResolvedValue(null);
      mockProductRepo.create.mockReturnValue(mockProduct);
      mockProductRepo.save.mockResolvedValue(mockProduct);
      mockProductRepo.findById.mockResolvedValue(mockProduct);

      const result = await service.create(dto);
      expect(result).toEqual(mockProduct);
      expect(mockProductRepo.findBySku).toHaveBeenCalledWith('TEST-001');
    });

    it('should throw ConflictException when SKU already exists', async () => {
      mockProductRepo.findBySku.mockResolvedValue({ id: 'existing' });
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when slug already exists', async () => {
      mockProductRepo.findBySku.mockResolvedValue(null);
      mockProductRepo.findBySlug.mockResolvedValue({ id: 'existing' });
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return product when found', async () => {
      const mockProduct = { id: 'uuid-1', name: 'Test' };
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      const result = await service.findById('uuid-1');
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when not found', async () => {
      mockProductRepo.findById.mockResolvedValue(null);
      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete product', async () => {
      const mockProduct = { id: 'uuid-1', name: 'Test' };
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      mockProductRepo.softDelete.mockResolvedValue(undefined);

      await service.remove('uuid-1');
      expect(mockProductRepo.softDelete).toHaveBeenCalledWith('uuid-1');
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockProductRepo.findById.mockResolvedValue(null);
      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStock', () => {
    it('should update stock successfully', async () => {
      const mockProduct = { id: 'uuid-1', stock: 10 };
      mockProductRepo.findById.mockResolvedValueOnce(mockProduct).mockResolvedValueOnce({ ...mockProduct, stock: 15 });
      mockProductRepo.updateStock.mockResolvedValue(undefined);

      const result = await service.updateStock('uuid-1', 5);
      expect(mockProductRepo.updateStock).toHaveBeenCalledWith('uuid-1', 5);
      expect(result.stock).toBe(15);
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      const mockProduct = { id: 'uuid-1', stock: 5 };
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      await expect(service.updateStock('uuid-1', -10)).rejects.toThrow();
    });
  });
});
