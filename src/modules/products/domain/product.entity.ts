import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../categories/domain/category.entity';
import { ProductImage } from './product-image.entity';
import { ProductVariant } from './product-variant.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('products')
export class Product {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true, length: 100 })
  sku: string;

  @ApiProperty()
  @Column({ length: 200 })
  name: string;

  @ApiProperty()
  @Column({ unique: true, length: 220 })
  slug: string;

  @ApiProperty({ nullable: true })
  @Column({ name: 'short_description', type: 'text', nullable: true })
  shortDescription: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: number;

  @ApiProperty({ nullable: true })
  @Column({ name: 'compare_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
  comparePrice: number;

  @ApiProperty({ nullable: true })
  @Column({ name: 'cost_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
  costPrice: number;

  @ApiProperty({ default: 0 })
  @Column({ default: 0 })
  stock: number;

  @ApiProperty({ default: 0 })
  @Column({ name: 'min_stock', default: 0 })
  minStock: number;

  @ApiProperty({ default: true })
  @Column({ name: 'track_stock', default: true })
  trackStock: boolean;

  @ApiProperty({ enum: ProductStatus, default: ProductStatus.DRAFT })
  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  @ApiProperty({ default: false })
  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @ApiProperty({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight: number;

  @ApiProperty({ nullable: true, description: '{ length, width, height }' })
  @Column({ type: 'jsonb', nullable: true })
  dimensions: { length: number; width: number; height: number };

  @ApiProperty({ type: [String] })
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @ApiProperty({ nullable: true })
  @Column({ name: 'meta_title', nullable: true })
  metaTitle: string;

  @ApiProperty({ nullable: true })
  @Column({ name: 'meta_description', nullable: true })
  metaDescription: string;

  @ApiProperty({ nullable: true })
  @ManyToOne(() => Category, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true, eager: false })
  images: ProductImage[];

  @OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true, eager: false })
  variants: ProductVariant[];

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
