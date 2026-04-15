import { paginationQuerySchema } from '@happyrisk/core/schemas';

import { createZodDto } from 'nestjs-zod';

export class PaginationQueryDto extends createZodDto(paginationQuerySchema) {}
