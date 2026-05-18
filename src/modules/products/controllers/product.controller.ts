import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { CreateProductDto, CreateProductImageDto, CreateProductVariantDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { FilterProductDto } from '../dto/filter-product.dto';
import { ApiPaginatedResponse } from '../../../common/decorators/api-paginated-response.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { Product } from '../domain/product.entity';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all products with filters and pagination' })
  @ApiPaginatedResponse(Product)
  findAll(@Query() filter: FilterProductDto) {
    return this.productService.findAll(filter);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiParam({ name: 'slug', type: 'string' })
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete product' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted product' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.restore(id);
  }

  // Stock management
  @Patch(':id/stock')
  @ApiOperation({ summary: 'Adjust product stock (positive to add, negative to subtract)' })
  @ApiBody({ schema: { properties: { quantity: { type: 'number', example: 10 } } } })
  updateStock(@Param('id', ParseUUIDPipe) id: string, @Body('quantity') quantity: number) {
    return this.productService.updateStock(id, quantity);
  }

  // Image management
  @Post(':id/images')
  @ApiOperation({ summary: 'Add images to product' })
  addImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() images: CreateProductImageDto[],
  ) {
    return this.productService.addImages(id, images);
  }

  @Delete('images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a product image' })
  removeImage(@Param('imageId', ParseUUIDPipe) imageId: string) {
    return this.productService.removeImage(imageId);
  }

  @Patch(':id/images/:imageId/primary')
  @ApiOperation({ summary: 'Set image as primary' })
  setPrimaryImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.productService.setPrimaryImage(id, imageId);
  }

  // Variant management
  @Post(':id/variants')
  @ApiOperation({ summary: 'Add a variant to product' })
  addVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProductVariantDto,
  ) {
    return this.productService.addVariant(id, dto);
  }

  @Patch('variants/:variantId')
  @ApiOperation({ summary: 'Update a product variant' })
  updateVariant(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: Partial<CreateProductVariantDto>,
  ) {
    return this.productService.updateVariant(variantId, dto);
  }

  @Delete('variants/:variantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a product variant' })
  removeVariant(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.productService.removeVariant(variantId);
  }

  @Patch('variants/:variantId/stock')
  @ApiOperation({ summary: 'Adjust variant stock' })
  @ApiBody({ schema: { properties: { quantity: { type: 'number', example: 5 } } } })
  updateVariantStock(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.productService.updateVariantStock(variantId, quantity);
  }
}
