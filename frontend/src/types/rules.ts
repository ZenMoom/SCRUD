// types/rules.ts
export interface RequestRule {
  content_type: string
  is_required: boolean
  body_type: string
  supports_file: boolean
}

export interface ParameterRule {
  in_type: string
  supports_enum: boolean
  is_required: boolean
  supports_array: boolean
  data_type: string
  is_editable: boolean
}

export interface ResponseRule {
  status_code: string
  content_type: string
  description: string
  is_error: boolean
  schema_type?: string
  ref_component?: string
}

export interface OperationFieldRule {
  request_rules?: RequestRule[]
  parameter_rules?: ParameterRule[]
  operation_field_rule_id: number
  is_editable: boolean
  field_name: string
  editable_sub_fields?: string
  response_rules?: ResponseRule[]
}

export interface SpecVersion {
  spec_version_id: number
  open_api_version: string
  description: string
}

export interface RulesResponse {
  spec_version: SpecVersion
  operation_field_rules: OperationFieldRule[]
  description: string
  service_spec_version_id: number
  scrud_version: string
  status: string
}
