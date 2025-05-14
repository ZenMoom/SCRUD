from app.core.models.api_models import GenerateRequest

rules = """
{
  "service_spec_version_id": 1,
  "spec_version": {
    "spec_version_id": 1,
    "open_api_version": "3.0.0",
    "description": "OpenAPI 3.0.0"
  },
  "scrud_version": "1.0.0",
  "status": "draft",
  "description": "SCRUD 서비스 기본 명세 1.0.0",
  "operation_field_rules": [
    {
      "operation_field_rule_id": 7,
      "field_name": "responses",
      "is_editable": true,
      "editable_sub_fields": "[\"status_code\", \"description\", \"content_type\", \"schema_type\", \"ref_component\"]",
      "parameter_rules": null,
      "request_rules": null,
      "response_rules": [
        {
          "is_error": false,
          "description": "성공적으로 처리됨",
          "schema_type": {
            "present": false
          },
          "status_code": "200",
          "content_type": {
            "present": false
          },
          "ref_component": {
            "present": false
          }
        },
        {
          "is_error": false,
          "description": "리소스가 생성됨",
          "schema_type": {
            "present": false
          },
          "status_code": "201",
          "content_type": {
            "present": false
          },
          "ref_component": {
            "present": false
          }
        },
        {
          "is_error": false,
          "description": "응답 본문 없음",
          "schema_type": {
            "present": false
          },
          "status_code": "204",
          "content_type": {
            "present": false
          },
          "ref_component": {
            "present": false
          }
        },
        {
          "is_error": true,
          "description": "잘못된 요청입니다.",
          "schema_type": {
            "present": false
          },
          "status_code": "400",
          "content_type": {
            "present": false
          },
          "ref_component": {
            "present": false
          }
        },
        {
          "is_error": true,
          "description": "인증이 필요합니다.",
          "schema_type": {
            "present": false
          },
          "status_code": "401",
          "content_type": {
            "present": false
          },
          "ref_component": {
            "present": false
          }
        },
        {
          "is_error": true,
          "description": "접근 권한이 없습니다.",
          "schema_type": {
            "present": false
          },
          "status_code": "403",
          "content_type": {
            "present": false
          },
          "ref_component": {
            "present": false
          }
        },
        {
          "is_error": true,
          "description": "서버 오류가 발생했습니다.",
          "schema_type": {
            "present": false
          },
          "status_code": "500",
          "content_type": {
            "present": false
          },
          "ref_component": {
            "present": false
          }
        }
      ]
    },
    {
      "operation_field_rule_id": 6,
      "field_name": "requestBody",
      "is_editable": true,
      "editable_sub_fields": "[\"required\", \"content.application/json.schema\"]",
      "parameter_rules": null,
      "request_rules": [
        {
          "is_required": true,
          "body_type": "object",
          "content_type": "application/json",
          "supports_file": false
        },
        {
          "is_required": true,
          "body_type": "array",
          "content_type": "application/json",
          "supports_file": false
        },
        {
          "is_required": false,
          "body_type": "string",
          "content_type": "application/json",
          "supports_file": false
        },
        {
          "is_required": true,
          "body_type": "object",
          "content_type": "multipart/form-data",
          "supports_file": true
        },
        {
          "is_required": true,
          "body_type": "object",
          "content_type": "application/x-www-form-urlencoded",
          "supports_file": false
        }
      ],
      "response_rules": null
    },
    {
      "operation_field_rule_id": 5,
      "field_name": "parameters",
      "is_editable": true,
      "editable_sub_fields": "[\"name\", \"in\", \"required\", \"schema.type\", \"schema.enum\"]",
      "parameter_rules": [
        {
          "in_type": "query",
          "data_type": "string",
          "is_editable": null,
          "is_required": false,
          "supports_enum": false,
          "supports_array": false
        },
        {
          "in_type": "query",
          "data_type": "string",
          "is_editable": null,
          "is_required": false,
          "supports_enum": true,
          "supports_array": false
        },
        {
          "in_type": "query",
          "data_type": "integer",
          "is_editable": null,
          "is_required": false,
          "supports_enum": false,
          "supports_array": false
        },
        {
          "in_type": "query",
          "data_type": "boolean",
          "is_editable": null,
          "is_required": false,
          "supports_enum": false,
          "supports_array": false
        },
        {
          "in_type": "query",
          "data_type": "array",
          "is_editable": null,
          "is_required": false,
          "supports_enum": false,
          "supports_array": true
        },
        {
          "in_type": "query",
          "data_type": "array",
          "is_editable": null,
          "is_required": false,
          "supports_enum": false,
          "supports_array": true
        },
        {
          "in_type": "query",
          "data_type": "array",
          "is_editable": null,
          "is_required": false,
          "supports_enum": false,
          "supports_array": true
        },
        {
          "in_type": "query",
          "data_type": "integer",
          "is_editable": null,
          "is_required": false,
          "supports_enum": true,
          "supports_array": false
        },
        {
          "in_type": "query",
          "data_type": "boolean",
          "is_editable": null,
          "is_required": false,
          "supports_enum": true,
          "supports_array": false
        },
        {
          "in_type": "path",
          "data_type": "string",
          "is_editable": null,
          "is_required": true,
          "supports_enum": false,
          "supports_array": false
        },
        {
          "in_type": "path",
          "data_type": "integer",
          "is_editable": null,
          "is_required": true,
          "supports_enum": false,
          "supports_array": false
        },
        {
          "in_type": "path",
          "data_type": "boolean",
          "is_editable": null,
          "is_required": true,
          "supports_enum": false,
          "supports_array": false
        },
        {
          "in_type": "header",
          "data_type": "string",
          "is_editable": null,
          "is_required": false,
          "supports_enum": false,
          "supports_array": false
        },
        {
          "in_type": "header",
          "data_type": "array",
          "is_editable": null,
          "is_required": false,
          "supports_enum": false,
          "supports_array": true
        },
        {
          "in_type": "cookie",
          "data_type": "string",
          "is_editable": null,
          "is_required": false,
          "supports_enum": false,
          "supports_array": false
        },
        {
          "in_type": "cookie",
          "data_type": "array",
          "is_editable": null,
          "is_required": false,
          "supports_enum": false,
          "supports_array": true
        }
      ],
      "request_rules": null,
      "response_rules": null
    },
    {
      "operation_field_rule_id": 4,
      "field_name": "tags",
      "is_editable": true,
      "editable_sub_fields": "[\"array\"]",
      "parameter_rules": null,
      "request_rules": null,
      "response_rules": null
    },
    {
      "operation_field_rule_id": 3,
      "field_name": "operationId",
      "is_editable": true,
      "editable_sub_fields": "[\"text\"]",
      "parameter_rules": null,
      "request_rules": null,
      "response_rules": null
    },
    {
      "operation_field_rule_id": 2,
      "field_name": "description",
      "is_editable": true,
      "editable_sub_fields": "[\"text\"]",
      "parameter_rules": null,
      "request_rules": null,
      "response_rules": null
    },
    {
      "operation_field_rule_id": 1,
      "field_name": "summary",
      "is_editable": true,
      "editable_sub_fields": "[\"text\"]",
      "parameter_rules": null,
      "request_rules": null,
      "response_rules": null
    }
  ]
}
"""

task = """
룰에 따라 출력 형식을 맞춰 api 명세를 생성해줘
endpoint는 /api/v1으로 시작해줘
restful한 api 명세를 만들어줘
pathParameters, queryParameters, requestBody, response의 값은 객체가 아닌 string으로 만들어줘 필요없으면 null로 해줘
모든 요구사항을 빼먹지말고 api 명세로 변경해줘
"""

# 프롬프트 생성
def build_prompt(data: GenerateRequest, format_instructions: str) -> str:
    return f"""
[요구사항]
{data.requirements}

[ERD]
{data.erd}

[규칙]
{rules}

[목표]
{task}

[추가 정보]
{data.extra_info}

[출력 형식]
{format_instructions}

❗ JSON 배열 전체는 한 줄로 출력해 주세요. 줄바꿈 없이 [ {...}, {...} ] 형태의 **정확한 JSON**으로 반환해 주세요.
❗ JSON 안의 문자열은 반드시 쌍따옴표(")로 감싸야 하며, \n 없이 작성하세요.
❗ ```json 코드 블록 없이 순수 JSON만 반환하세요.
"""

