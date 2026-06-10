import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PatientStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { RoutesService } from '../routes/routes.service'

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routes: RoutesService,
  ) {}

  /** Cierre administrativo de un paciente fallecido (revisión del admin). */
  async markAdministrativeClosure(patientId: string, notes: string | undefined, adminId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      select: { id: true, status: true, administrativeClosureAt: true },
    })
    if (!patient) throw new NotFoundException('Paciente no encontrado')
    if (patient.status !== PatientStatus.DECEASED) {
      throw new BadRequestException('Solo se cierran administrativamente pacientes fallecidos')
    }
    if (patient.administrativeClosureAt) {
      throw new BadRequestException('El paciente ya tiene cierre administrativo')
    }
    return this.prisma.patient.update({
      where: { id: patientId },
      data: {
        administrativeClosureAt: new Date(),
        administrativeClosedBy: { connect: { id: adminId } },
        administrativeClosureNotes: notes,
      },
      select: { id: true, administrativeClosureAt: true },
    })
  }

  /** Reintenta un despacho fallido re-despachando su ruta. */
  async retryNotification(dispatchId: string, adminId: string) {
    const dispatch = await this.prisma.routeDispatch.findUnique({
      where: { id: dispatchId },
      select: { id: true, routeId: true },
    })
    if (!dispatch) throw new NotFoundException('Despacho no encontrado')
    return this.routes.dispatch(dispatch.routeId, adminId)
  }

  /** Descarta un despacho fallido (no requiere reintento). */
  async discardNotification(dispatchId: string) {
    const dispatch = await this.prisma.routeDispatch.findUnique({
      where: { id: dispatchId },
      select: { id: true },
    })
    if (!dispatch) throw new NotFoundException('Despacho no encontrado')
    return this.prisma.routeDispatch.update({
      where: { id: dispatchId },
      data: { discardedAt: new Date() },
      select: { id: true, discardedAt: true },
    })
  }
}
