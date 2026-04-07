import { changeRoleSchema, userCreateSchema, userUpdateSchema } from '@happyrisk/core';

import { createZodDto } from 'nestjs-zod';

export class CreateUserDto extends createZodDto(userCreateSchema) {}
export class UpdateUserDto extends createZodDto(userUpdateSchema) {}
export class ChangeRoleDto extends createZodDto(changeRoleSchema) {}
