export type PatientStatus = 'ACTIVE' | 'PASSIVE' | 'DECEASED'

export type Sex = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN'

export type IdentificationType =
  | 'CEDULA'
  | 'PASSPORT'
  | 'BIRTH_CERTIFICATE'
  | 'FOREIGN_ID'
  | 'OTHER'

export interface PatientCategory {
  id: string
  code: string
  name: string
}

export interface Patient {
  id: string
  mrn: string
  identificationType: IdentificationType
  identificationNo: string
  firstName: string
  lastName: string
  birthDate: string
  sex: Sex
  phone: string | null
  email: string | null
  categoryId: string
  status: PatientStatus
  admittedAt: string | null
  deceasedAt: string | null
  deathDate: string | null
  deathPlace: string | null
  lastRegularVisitAt: string | null
  nextRegularVisitDue: string | null
  createdAt: string
  updatedAt: string
  category?: PatientCategory
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
