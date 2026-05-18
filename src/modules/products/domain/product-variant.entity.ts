import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Unique SKU for this variant' })
  @Column({ unique: true, length: 100 })
  sku: string;

  @ApiProperty()
  @Column({ length: 200 })
  name: string;

  @ApiProperty({
    description: 'Variant attributes as key-value pairs',
    example: { size: 'L', color: 'Red' },
  })
  @Column({ type: 'jsonb', nullable: true })
  attributes: Record<string, string>;

  @ApiProperty({ nullable: true, description: 'Override product price if set' })
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  price: number;

  @ApiProperty({ default: 0 })
  @Column({ default: 0 })
  stock: number;

  @ApiProperty({ nullable: true })
  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @ApiProperty({ default: true })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
