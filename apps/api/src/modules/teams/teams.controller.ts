import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ListQueryDto } from '@/common/dto/list-query.dto';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';

import { CreateTeamDto, UpdateTeamDto } from './teams.dto';
import { TeamsService } from './teams.service';

@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(@Body() body: CreateTeamDto) {
    return this.teamsService.create(body);
  }

  @Get()
  findAll(@Query() query: ListQueryDto) {
    return this.teamsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateTeamDto) {
    return this.teamsService.update(id, body);
  }

  @Patch(':id/archive')
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.teamsService.archive(id);
  }
}
