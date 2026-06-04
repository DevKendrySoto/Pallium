/** Error normalizado que expone el wrapper de fetch. */
export interface ApiError {
  code: string
  message: string
  status: number
}

export class ApiException extends Error implements ApiError {
  code: string
  status: number

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'ApiException'
    this.code = error.code
    this.status = error.status
  }
}
