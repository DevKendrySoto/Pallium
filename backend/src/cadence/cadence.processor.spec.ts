import { CadenceProcessor } from './cadence.processor'

const DAY = 24 * 60 * 60 * 1000

function build() {
  const prisma: any = { patient: { findMany: jest.fn() } }
  const alerts: any = { raise: jest.fn() }
  const processor = new CadenceProcessor(prisma, alerts)
  return { processor, prisma, alerts }
}

describe('CadenceProcessor.scan', () => {
  it('levanta alerta HIGH para vencida y MEDIUM para próxima a vencer', async () => {
    const { processor, prisma, alerts } = build()
    prisma.patient.findMany.mockResolvedValue([
      { id: 'overdue', nextRegularVisitDue: new Date(Date.now() - 2 * DAY) },
      { id: 'soon', nextRegularVisitDue: new Date(Date.now() + 2 * DAY) },
    ])
    alerts.raise.mockResolvedValue({ id: 'al' })

    const result = await processor.scan()

    expect(result.scanned).toBe(2)
    expect(result.raised).toBe(2)
    expect(alerts.raise.mock.calls[0][0]).toMatchObject({ severity: 'HIGH', type: 'CADENCE', dedup: true })
    expect(alerts.raise.mock.calls[1][0]).toMatchObject({ severity: 'MEDIUM' })
  })

  it('no cuenta como nueva si la alerta ya existía (dedup → null)', async () => {
    const { processor, prisma, alerts } = build()
    prisma.patient.findMany.mockResolvedValue([
      { id: 'overdue', nextRegularVisitDue: new Date(Date.now() - DAY) },
    ])
    alerts.raise.mockResolvedValue(null)

    const result = await processor.scan()
    expect(result.scanned).toBe(1)
    expect(result.raised).toBe(0)
  })
})
