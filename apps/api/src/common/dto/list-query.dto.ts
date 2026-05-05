import { listQuerySchema } from '@happyrisk/core/schemas';

import { createZodDto } from 'nestjs-zod';

export class ListQueryDto extends createZodDto(listQuerySchema) {}
