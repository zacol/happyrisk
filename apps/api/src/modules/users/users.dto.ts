import { createZodDto } from 'nestjs-zod';
import { userCreateSchema, userUpdateSchema, changeRoleSchema } from '@happyrisk/core';

export class CreateUserDto extends createZodDto(userCreateSchema) {}
export class UpdateUserDto extends createZodDto(userUpdateSchema) {}
export class ChangeRoleDto extends createZodDto(changeRoleSchema) {}
