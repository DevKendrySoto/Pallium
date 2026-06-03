import { Injectable, Logger } from '@nestjs/common'

export interface SendResult {
  providerMessageId?: string
}

/** Contrato de envío de WhatsApp. Implementaciones concretas se inyectan por token. */
export interface WhatsappProvider {
  sendText(to: string, body: string): Promise<SendResult>
}

export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER')

/**
 * Implementación por defecto (dev/local): registra el mensaje en el log en vez
 * de enviarlo. En producción se sustituye por un proveedor real (p. ej. la
 * WhatsApp Cloud API de Meta) registrando otra clase contra WHATSAPP_PROVIDER.
 */
@Injectable()
export class LogWhatsappProvider implements WhatsappProvider {
  private readonly logger = new Logger('WhatsApp')

  async sendText(to: string, body: string): Promise<SendResult> {
    this.logger.log(`(simulado) → ${to}\n${body}`)
    return { providerMessageId: `log-${to}-${body.length}` }
  }
}
