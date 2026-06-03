import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { DriversService } from './drivers.service'
import { CreateDriverDto, UpdateDriverDto } from './dto/create-driver.dto'

@Controller('drivers')
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

  @Get()
  @RequirePermissions('driver:read')
  list() {
    return this.drivers.list()
  }

  @Post()
  @RequirePermissions('driver:manage')
  create(@Body() dto: CreateDriverDto) {
    return this.drivers.create(dto)
  }

  @Patch(':id')
  @RequirePermissions('driver:manage')
  update(@Param('id') id: string, @Body() dto: UpdateDriverDto) {
    return this.drivers.update(id, dto)
  }
}
