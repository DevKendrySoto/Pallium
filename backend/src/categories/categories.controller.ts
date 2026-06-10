import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { CategoriesService } from './categories.service'
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto'

@Controller('patient-categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @RequirePermissions('patient:read')
  list() {
    return this.categories.list()
  }

  @Get('all')
  @RequirePermissions('category:manage')
  listAll() {
    return this.categories.listAll()
  }

  @Post()
  @RequirePermissions('category:manage')
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto)
  }

  @Patch(':id')
  @RequirePermissions('category:manage')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto)
  }
}
