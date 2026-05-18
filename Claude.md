# product-service

NestJS microservice for product management with PostgreSQL and Clean Architecture.

## Tech Stack
- **Framework**: NestJS 10 + TypeScript
- **Database**: PostgreSQL via TypeORM 0.3
- **Architecture**: Clean Architecture with Repository Pattern
- **API Docs**: Swagger/OpenAPI (at `/docs`)
- **Auth**: JWT Bearer token (routes marked `@Public()` skip auth)

## Project Structure
```
src/
├── config/           # App and database config (registerAs)
├── common/
│   ├── constants/    # Shared constants (tokens, defaults)
│   ├── decorators/   # @Public(), @ApiPaginatedResponse()
│   ├── dto/          # PaginationDto, PaginatedResultDto
│   ├── filters/      # HttpExceptionFilter (global)
│   ├── guards/       # JwtAuthGuard (global)
│   └── interceptors/ # ResponseInterceptor (wraps all responses)
└── modules/
    ├── categories/   # Category CRUD with tree hierarchy
    ├── products/     # Product CRUD + images + variants + stock
    └── health/       # Health check endpoint
```

## Key Features
- **Products**: CRUD, soft delete, restore, search/filter, pagination, stock management
- **Product Images**: add/remove/set-primary
- **Product Variants**: SKU-level variants with attributes (size, color, etc.)
- **Categories**: hierarchical tree (closure-table), CRUD, soft delete
- **Pagination**: page/limit/sortBy/sortOrder on all list endpoints
- **Validation**: class-validator on all DTOs, whitelist mode enabled
- **Response format**: `{ success, statusCode, data, timestamp }`
- **Error format**: `{ success: false, statusCode, path, message, timestamp }`

## Running Locally
```bash
cp .env.example .env          # configure DB credentials
npm install
npm run start:dev             # http://localhost:3000/api/v1
# Swagger: http://localhost:3000/docs
```

## Docker
```bash
docker-compose up -d          # starts app + postgres
```

## Testing
```bash
npm test                      # unit tests
npm run test:cov              # with coverage
```

## API Endpoints

### Products (`/api/v1/products`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | / | JWT | Create product |
| GET | / | Public | List products (filter/paginate) |
| GET | /slug/:slug | Public | Get by slug |
| GET | /:id | Public | Get by ID |
| PATCH | /:id | JWT | Update product |
| DELETE | /:id | JWT | Soft delete |
| POST | /:id/restore | JWT | Restore |
| PATCH | /:id/stock | JWT | Adjust stock |
| POST | /:id/images | JWT | Add images |
| DELETE | /images/:imageId | JWT | Remove image |
| PATCH | /:id/images/:imageId/primary | JWT | Set primary image |
| POST | /:id/variants | JWT | Add variant |
| PATCH | /variants/:variantId | JWT | Update variant |
| DELETE | /variants/:variantId | JWT | Remove variant |
| PATCH | /variants/:variantId/stock | JWT | Adjust variant stock |

### Categories (`/api/v1/categories`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | / | JWT | Create category |
| GET | / | Public | List categories |
| GET | /tree | Public | Get category tree |
| GET | /slug/:slug | Public | Get by slug |
| GET | /:id | Public | Get by ID |
| PATCH | /:id | JWT | Update |
| DELETE | /:id | JWT | Soft delete |
| POST | /:id/restore | JWT | Restore |

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/health | Public | DB health check |

## Repository Pattern
- Interfaces in `repositories/*.repository.interface.ts`
- Implementations injected via Symbol tokens (e.g., `PRODUCT_REPOSITORY`)
- Swap implementation without changing service layer

## Environment Variables
See `.env.example` for all required variables.
