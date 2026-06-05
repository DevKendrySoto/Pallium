import { Module } from '@nestjs/common'
import { StorageService } from '../storage/storage.service'
import { DocumentsController } from './documents.controller'
import { DocumentsService } from './documents.service'

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, StorageService],
  exports: [DocumentsService, StorageService],
})
export class DocumentsModule {}
