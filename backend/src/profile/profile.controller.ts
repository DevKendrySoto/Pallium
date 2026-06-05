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
  Put,
} from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import {
  CreateAllergyDto,
  CreateHistoryDto,
  UpdateAllergyDto,
  UpdateHistoryDto,
  UpsertDirectiveDto,
  UpsertHabitDto,
} from './dto/profile.dto'
import { ProfileService } from './profile.service'

@Controller()
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  // ---- Alergias ----
  @Get('patients/:patientId/allergies')
  @RequirePermissions('patient:read')
  listAllergies(@Param('patientId') patientId: string) {
    return this.profile.listAllergies(patientId)
  }

  @Post('patients/:patientId/allergies')
  @RequirePermissions('allergy:write')
  createAllergy(
    @Param('patientId') patientId: string,
    @Body() dto: CreateAllergyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.profile.createAllergy(patientId, dto, userId)
  }

  @Patch('allergies/:id')
  @RequirePermissions('allergy:write')
  updateAllergy(@Param('id') id: string, @Body() dto: UpdateAllergyDto) {
    return this.profile.updateAllergy(id, dto)
  }

  @Delete('allergies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('allergy:write')
  deleteAllergy(@Param('id') id: string) {
    return this.profile.deleteAllergy(id)
  }

  // ---- Antecedentes ----
  @Get('patients/:patientId/medical-history')
  @RequirePermissions('patient:read')
  listHistory(@Param('patientId') patientId: string) {
    return this.profile.listHistory(patientId)
  }

  @Post('patients/:patientId/medical-history')
  @RequirePermissions('history:write')
  createHistory(
    @Param('patientId') patientId: string,
    @Body() dto: CreateHistoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.profile.createHistory(patientId, dto, userId)
  }

  @Patch('medical-history/:id')
  @RequirePermissions('history:write')
  updateHistory(@Param('id') id: string, @Body() dto: UpdateHistoryDto) {
    return this.profile.updateHistory(id, dto)
  }

  @Delete('medical-history/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('history:write')
  deleteHistory(@Param('id') id: string) {
    return this.profile.deleteHistory(id)
  }

  // ---- Hábitos ----
  @Get('patients/:patientId/habits')
  @RequirePermissions('patient:read')
  listHabits(@Param('patientId') patientId: string) {
    return this.profile.listHabits(patientId)
  }

  @Put('patients/:patientId/habits')
  @RequirePermissions('history:write')
  upsertHabit(
    @Param('patientId') patientId: string,
    @Body() dto: UpsertHabitDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.profile.upsertHabit(patientId, dto, userId)
  }

  @Delete('habits/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('history:write')
  deleteHabit(@Param('id') id: string) {
    return this.profile.deleteHabit(id)
  }

  // ---- Voluntades anticipadas ----
  @Get('patients/:patientId/advance-directive')
  @RequirePermissions('patient:read')
  getDirective(@Param('patientId') patientId: string) {
    return this.profile.getDirective(patientId)
  }

  @Put('patients/:patientId/advance-directive')
  @RequirePermissions('directive:write')
  upsertDirective(
    @Param('patientId') patientId: string,
    @Body() dto: UpsertDirectiveDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.profile.upsertDirective(patientId, dto, userId)
  }
}
