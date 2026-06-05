import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import {
  AddStopsDto,
  AssignClinicalTeamDto,
  AssignDriverDto,
  BuildFromVisitsDto,
  ChangeRouteStatusDto,
  CreateRouteDto,
  ListRoutesDto,
  ReorderStopsDto,
} from './dto/route.dto'
import { RoutesService } from './routes.service'

@Controller('routes')
export class RoutesController {
  constructor(private readonly routes: RoutesService) {}

  @Get()
  @RequirePermissions('route:read')
  list(@Query() query: ListRoutesDto) {
    return this.routes.list(query)
  }

  // Personal clínico asignable. Declarado antes de :id para no ser capturado por él.
  @Get('clinical-staff')
  @RequirePermissions('route:assign-clinical-team')
  clinicalStaff() {
    return this.routes.getClinicalStaff()
  }

  @Get(':id')
  @RequirePermissions('route:read')
  get(@Param('id') id: string) {
    return this.routes.get(id)
  }

  @Post()
  @RequirePermissions('route:create')
  create(@Body() dto: CreateRouteDto) {
    return this.routes.create(dto)
  }

  @Post('from-visits')
  @RequirePermissions('route:create')
  buildFromVisits(@Body() dto: BuildFromVisitsDto) {
    return this.routes.buildFromVisits(dto)
  }

  @Post(':id/stops')
  @RequirePermissions('route:update')
  addStops(@Param('id') id: string, @Body() dto: AddStopsDto) {
    return this.routes.addStops(id, dto)
  }

  @Patch(':id/stops/reorder')
  @RequirePermissions('route:update')
  reorder(@Param('id') id: string, @Body() dto: ReorderStopsDto) {
    return this.routes.reorderStops(id, dto)
  }

  @Delete(':id/stops/:stopId')
  @RequirePermissions('route:update')
  removeStop(@Param('id') id: string, @Param('stopId') stopId: string) {
    return this.routes.removeStop(id, stopId)
  }

  @Patch(':id/driver')
  @RequirePermissions('route:update')
  assignDriver(@Param('id') id: string, @Body() dto: AssignDriverDto) {
    return this.routes.assignDriver(id, dto.driverId)
  }

  // Asignación de equipo clínico: permiso aparte (ADMIN + COORDINADOR_MEDICO).
  // Agenda puede crear ruta/chofer/paradas (route:update) pero NO el equipo clínico.
  @Patch(':id/clinical-team')
  @RequirePermissions('route:assign-clinical-team')
  assignClinicalTeam(@Param('id') id: string, @Body() dto: AssignClinicalTeamDto) {
    return this.routes.assignClinicalTeam(id, dto)
  }

  @Patch(':id/status')
  @RequirePermissions('route:update')
  changeStatus(@Param('id') id: string, @Body() dto: ChangeRouteStatusDto) {
    return this.routes.changeStatus(id, dto)
  }

  @Post(':id/dispatch')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('route:dispatch')
  dispatch(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.routes.dispatch(id, userId)
  }
}
