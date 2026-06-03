import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateDriverDto, UpdateDriverDto } from './dto/create-driver.dto'

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateDriverDto) {
    return this.prisma.driver.create({ data: dto })
  }

  list() {
    return this.prisma.driver.findMany({ orderBy: { fullName: 'asc' } })
  }

  async getOrThrow(id: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id } })
    if (!driver) throw new NotFoundException('Chofer no encontrado')
    return driver
  }

  async update(id: string, dto: UpdateDriverDto) {
    await this.getOrThrow(id)
    return this.prisma.driver.update({ where: { id }, data: dto })
  }
}
