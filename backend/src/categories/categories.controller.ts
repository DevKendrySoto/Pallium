import { Controller, Get } from '@nestjs/common'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { CategoriesService } from './categories.service'

@Controller('patient-categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @RequirePermissions('patient:read')
  list() {
    return this.categories.list()
  }
}
