import { teamCreateSchema, teamUpdateSchema } from '@happyrisk/core';

import { createZodDto } from 'nestjs-zod';

export class CreateTeamDto extends createZodDto(teamCreateSchema) {}
export class UpdateTeamDto extends createZodDto(teamUpdateSchema) {}
