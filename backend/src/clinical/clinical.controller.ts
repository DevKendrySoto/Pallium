import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { ClinicalService } from './clinical.service'
import {
  MedicalNoteDto,
  NursingNoteDto,
  PhysiotherapyNoteDto,
  PsychologyNoteDto,
  SocialWorkNoteDto,
} from './dto/notes.dto'

@Controller('clinical')
export class ClinicalController {
  constructor(private readonly clinical: ClinicalService) {}

  @Get()
  @RequirePermissions('clinical:read')
  list(@Query('patientId') patientId: string, @Query('specialty') specialty?: string) {
    return this.clinical.listByPatient(patientId, specialty)
  }

  @Get(':id')
  @RequirePermissions('clinical:read')
  get(@Param('id') id: string) {
    return this.clinical.getById(id)
  }

  @Post('medical')
  @RequirePermissions('note:medical:write')
  medical(@Body() dto: MedicalNoteDto, @CurrentUser('id') userId: string) {
    return this.clinical.createMedical(dto, userId)
  }

  @Post('nursing')
  @RequirePermissions('note:nursing:write')
  nursing(@Body() dto: NursingNoteDto, @CurrentUser('id') userId: string) {
    return this.clinical.createNursing(dto, userId)
  }

  @Post('psychology')
  @RequirePermissions('note:psychology:write')
  psychology(@Body() dto: PsychologyNoteDto, @CurrentUser('id') userId: string) {
    return this.clinical.createPsychology(dto, userId)
  }

  @Post('social-work')
  @RequirePermissions('note:social:write')
  socialWork(@Body() dto: SocialWorkNoteDto, @CurrentUser('id') userId: string) {
    return this.clinical.createSocialWork(dto, userId)
  }

  @Post('physiotherapy')
  @RequirePermissions('note:physio:write')
  physiotherapy(@Body() dto: PhysiotherapyNoteDto, @CurrentUser('id') userId: string) {
    return this.clinical.createPhysiotherapy(dto, userId)
  }
}
