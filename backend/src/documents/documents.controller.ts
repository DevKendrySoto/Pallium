import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { DocumentsService } from './documents.service'

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @RequirePermissions('document:read')
  list(@Query('patientId') patientId: string) {
    return this.documents.list(patientId)
  }

  @Get(':id/url')
  @RequirePermissions('document:read')
  getUrl(@Param('id') id: string) {
    return this.documents.getUrl(id)
  }

  @Post()
  @RequirePermissions('document:upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 }) // 10 MB
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
    @Body('patientId') patientId: string,
    @Body('category') category: string | undefined,
    @CurrentUser('id') userId: string,
  ) {
    return this.documents.upload(file, { patientId, category }, userId)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('document:delete')
  remove(@Param('id') id: string) {
    return this.documents.remove(id)
  }
}
