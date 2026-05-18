import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginatedResultDto, PaginationMeta } from '../dto/paginated-result.dto';

export const ApiPaginatedResponse = <TModel extends Type<any>>(model: TModel) =>
  applyDecorators(
    ApiExtraModels(PaginatedResultDto, PaginationMeta, model),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              statusCode: { type: 'number', example: 200 },
              timestamp: { type: 'string' },
              data: {
                properties: {
                  data: { type: 'array', items: { $ref: getSchemaPath(model) } },
                  meta: { $ref: getSchemaPath(PaginationMeta) },
                },
              },
            },
          },
        ],
      },
    }),
  );
