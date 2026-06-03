import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, type OnModuleInit } from '@nestjs/common'
import { Queue } from 'bullmq'
import { CADENCE_CRON, CADENCE_QUEUE, CADENCE_SCAN_JOB } from './cadence.constants'

/** Programa el escaneo diario de cadencia como job repetible idempotente. */
@Injectable()
export class CadenceService implements OnModuleInit {
  constructor(@InjectQueue(CADENCE_QUEUE) private readonly queue: Queue) {}

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      CADENCE_SCAN_JOB,
      {},
      {
        repeat: { pattern: CADENCE_CRON },
        jobId: CADENCE_SCAN_JOB, // evita duplicar el repetible en cada arranque
        removeOnComplete: true,
        removeOnFail: 100,
      },
    )
  }

  /** Encola un escaneo inmediato (además del manual síncrono del controller). */
  enqueueScan() {
    return this.queue.add(`${CADENCE_SCAN_JOB}-manual`, {}, { removeOnComplete: true })
  }
}
