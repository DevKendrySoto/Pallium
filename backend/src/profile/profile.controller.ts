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
  CreateCaregiverDto,
  CreateFamilyMemberDto,
  CreateHistoryDto,
  CreateImmunizationDto,
  GenogramDto,
  UpdateAllergyDto,
  UpdateCaregiverDto,
  UpdateFamilyMemberDto,
  UpdateHistoryDto,
  UpdateImmunizationDto,
  UpsertDirectiveDto,
  UpsertHabitDto,
  UpsertSocialProfileDto,
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

  // ---- Cuidadores (Fase 2) ----
  @Get('patients/:patientId/caregivers')
  @RequirePermissions('patient:read')
  listCaregivers(@Param('patientId') patientId: string) {
    return this.profile.listCaregivers(patientId)
  }

  @Post('patients/:patientId/caregivers')
  @RequirePermissions('social:write')
  createCaregiver(@Param('patientId') patientId: string, @Body() dto: CreateCaregiverDto) {
    return this.profile.createCaregiver(patientId, dto)
  }

  @Patch('caregivers/:id')
  @RequirePermissions('social:write')
  updateCaregiver(@Param('id') id: string, @Body() dto: UpdateCaregiverDto) {
    return this.profile.updateCaregiver(id, dto)
  }

  @Delete('caregivers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('social:write')
  deleteCaregiver(@Param('id') id: string) {
    return this.profile.deleteCaregiver(id)
  }

  // ---- Familia y genograma (Fase 2) ----
  @Get('patients/:patientId/family-members')
  @RequirePermissions('patient:read')
  listFamily(@Param('patientId') patientId: string) {
    return this.profile.listFamily(patientId)
  }

  @Post('patients/:patientId/family-members')
  @RequirePermissions('social:write')
  createFamilyMember(
    @Param('patientId') patientId: string,
    @Body() dto: CreateFamilyMemberDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.profile.createFamilyMember(patientId, dto, userId)
  }

  @Patch('family-members/:id')
  @RequirePermissions('social:write')
  updateFamilyMember(@Param('id') id: string, @Body() dto: UpdateFamilyMemberDto) {
    return this.profile.updateFamilyMember(id, dto)
  }

  @Delete('family-members/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('social:write')
  deleteFamilyMember(@Param('id') id: string) {
    return this.profile.deleteFamilyMember(id)
  }

  @Get('patients/:patientId/genogram')
  @RequirePermissions('patient:read')
  getGenogram(@Param('patientId') patientId: string) {
    return this.profile.getGenogram(patientId)
  }

  @Put('patients/:patientId/genogram')
  @RequirePermissions('social:write')
  setGenogram(@Param('patientId') patientId: string, @Body() dto: GenogramDto) {
    return this.profile.setGenogram(patientId, dto.genogram)
  }

  // ---- Perfil social / vivienda (Fase 2) ----
  @Get('patients/:patientId/social-profile')
  @RequirePermissions('patient:read')
  getSocialProfile(@Param('patientId') patientId: string) {
    return this.profile.getSocialProfile(patientId)
  }

  @Put('patients/:patientId/social-profile')
  @RequirePermissions('social:write')
  upsertSocialProfile(
    @Param('patientId') patientId: string,
    @Body() dto: UpsertSocialProfileDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.profile.upsertSocialProfile(patientId, dto, userId)
  }

  // ---- Inmunizaciones (Fase 2) ----
  @Get('patients/:patientId/immunizations')
  @RequirePermissions('patient:read')
  listImmunizations(@Param('patientId') patientId: string) {
    return this.profile.listImmunizations(patientId)
  }

  @Post('patients/:patientId/immunizations')
  @RequirePermissions('immunization:write')
  createImmunization(
    @Param('patientId') patientId: string,
    @Body() dto: CreateImmunizationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.profile.createImmunization(patientId, dto, userId)
  }

  @Patch('immunizations/:id')
  @RequirePermissions('immunization:write')
  updateImmunization(@Param('id') id: string, @Body() dto: UpdateImmunizationDto) {
    return this.profile.updateImmunization(id, dto)
  }

  @Delete('immunizations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('immunization:write')
  deleteImmunization(@Param('id') id: string) {
    return this.profile.deleteImmunization(id)
  }
}
