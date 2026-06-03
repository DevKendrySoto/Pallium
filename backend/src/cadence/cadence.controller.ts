import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { CadenceProcessor } from './cadence.processor'

@Controller('cadence')
export class CadenceController {
  constructor(private readonly processor: CadenceProcessor) {}

  /** Dispara un escaneo de cadencia ahora y devuelve el resumen (operativo/admin). */
  @Post('run')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('cadence:run')
  run() {
    return this.processor.scan()
  }
}
