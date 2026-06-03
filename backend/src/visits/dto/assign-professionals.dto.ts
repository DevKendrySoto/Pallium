import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator'
import { VisitAssignmentInput } from './create-visit.dto'

export class AssignProfessionalsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VisitAssignmentInput)
  assignments!: VisitAssignmentInput[]
}
