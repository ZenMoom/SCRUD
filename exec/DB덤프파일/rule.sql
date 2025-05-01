INSERT INTO spec_version (spec_version_id, openapi_major, openapi_minor, openapi_patch, description, created_at,
                          updated_at)
VALUES (1, 3, 0, 0, 'OpenAPI 3.0.0', NOW(), NOW());

INSERT INTO service_spec_version (service_spec_version_id, spec_version_id, version_major, version_minor, version_patch,
                                  status, description, created_at, updated_at)
VALUES (1, 1, 1, 0, 0, 'draft', 'SCRUD 서비스 기본 명세 1.0.0', NOW(), NOW());

-- 1. summary
INSERT INTO operation_field_rule (operation_field_rule_id, service_spec_version_id, field_name, is_editable,
                                  editable_sub_fields, created_at, updated_at)
VALUES (1, 1, 'summary', true, '["text"]', NOW(), NOW());

-- 2. description
INSERT INTO operation_field_rule (operation_field_rule_id, service_spec_version_id, field_name, is_editable,
                                  editable_sub_fields, created_at, updated_at)
VALUES (2, 1, 'description', true, '["text"]', NOW(), NOW());

-- 3. operationId
INSERT INTO operation_field_rule (operation_field_rule_id, service_spec_version_id, field_name, is_editable,
                                  editable_sub_fields, created_at, updated_at)
VALUES (3, 1, 'operationId', true, '["text"]', NOW(), NOW());

-- 4. tags
INSERT INTO operation_field_rule (operation_field_rule_id, service_spec_version_id, field_name, is_editable,
                                  editable_sub_fields, created_at, updated_at)
VALUES (4, 1, 'tags', true, '["array"]', NOW(), NOW());

-- 5. parameters
INSERT INTO operation_field_rule (operation_field_rule_id, service_spec_version_id, field_name, is_editable,
                                  editable_sub_fields, created_at, updated_at)
VALUES (5, 1, 'parameters', true, '["name", "in", "required", "schema.type", "schema.enum"]', NOW(), NOW());

-- 6. requestBody
INSERT INTO operation_field_rule (operation_field_rule_id, service_spec_version_id, field_name, is_editable,
                                  editable_sub_fields, created_at, updated_at)
VALUES (6, 1, 'requestBody', true, '["required", "content.application/json.schema"]', NOW(), NOW());

-- 7. responses
INSERT INTO operation_field_rule (operation_field_rule_id, service_spec_version_id, field_name, is_editable,
                                  editable_sub_fields, created_at, updated_at)
VALUES (7, 1, 'responses', true, '["status_code", "description", "content_type", "schema_type", "ref_component"]',
        NOW(), NOW());

-- ✅ Editable: true (13가지)
-- 기본적인 query 타입
INSERT INTO parameter_rule (parameter_rule_id, operation_field_rule_id, in_type, data_type, supports_enum,
                            supports_array, is_required, is_editable, created_at)
VALUES (1, 5, 'query', 'string', FALSE, FALSE, FALSE, TRUE, NOW());
INSERT INTO parameter_rule (parameter_rule_id, operation_field_rule_id, in_type, data_type, supports_enum,
                            supports_array, is_required, is_editable, created_at)
VALUES (2, 5, 'query', 'string', TRUE, FALSE, FALSE, TRUE, NOW());
INSERT INTO parameter_rule (parameter_rule_id, operation_field_rule_id, in_type, data_type, supports_enum,
                            supports_array, is_required, is_editable, created_at)
VALUES (3, 5, 'query', 'integer', FALSE, FALSE, FALSE, TRUE, NOW());
INSERT INTO parameter_rule (parameter_rule_id, operation_field_rule_id, in_type, data_type, supports_enum,
                            supports_array, is_required, is_editable, created_at)
VALUES (4, 5, 'query', 'boolean', FALSE, FALSE, FALSE, TRUE, NOW());

-- query array (items type 별로 구분)
INSERT INTO parameter_rule (parameter_rule_id, operation_field_rule_id, in_type, data_type, supports_enum,
                            supports_array, is_required, is_editable, created_at)
VALUES (5, 5, 'query', 'array', FALSE, TRUE, FALSE, TRUE, NOW()); -- string[]
INSERT INTO parameter_rule (parameter_rule_id, operation_field_rule_id, in_type, data_type, supports_enum,
                            supports_array, is_required, is_editable, created_at)
VALUES (6, 5, 'query', 'array', FALSE, TRUE, FALSE, TRUE, NOW()); -- integer[]
INSERT INTO parameter_rule (parameter_rule_id, operation_field_rule_id, in_type, data_type, supports_enum,
                            supports_array, is_required, is_editable, created_at)
VALUES (7, 5, 'query', 'array', FALSE, TRUE, FALSE, TRUE, NOW());
-- boolean[]

-- query enum 확장 (non-string enum)
INSERT INTO parameter_rule (parameter_rule_id, operation_field_rule_id, in_type, data_type, supports_enum,
                            supports_array, is_required, is_editable, created_at)
VALUES (8, 5, 'query', 'integer', TRUE, FALSE, FALSE, TRUE, NOW());
INSERT INTO parameter_rule (parameter_rule_id, operation_field_rule_id, in_type, data_type, supports_enum,
                            supports_array, is_required, is_editable, created_at)
VALUES (9, 5, 'query', 'boolean', TRUE, FALSE, FALSE, TRUE, NOW());

-- path 파라미터
INSERT INTO parameter_rule (parameter_rule_id, operation_field_rule_id, in_type, data_type, supports_enum,
                            supports_array, is_required, is_editable, created_at)
VALUES (10, 5, 'path', 'string', FALSE, FALSE, TRUE, TRUE, NOW());
INSERT INTO parameter_rule (parameter_rule_id, operation_field_rule_id, in_type, data_type, supports_enum,
                            supports_array, is_required, is_editable, created_at)
VALUES (11, 5, 'path', 'integer', FALSE, FALSE, TRUE, TRUE, NOW());
INSERT INTO parameter_rule (parameter_rule_id, operation_field_rule_id, in_type, data_type, supports_enum,
                            supports_array, is_required, is_editable, created_at)
VALUES (12, 5, 'path', 'boolean', FALSE, FALSE, TRUE, TRUE, NOW());

-- ❌ Editable: false (header, cookie)

-- 9. header + string
INSERT INTO parameter_rule (parameter_rule_id, operation_field_rule_id, in_type, data_type, supports_enum,
                            supports_array, is_required, is_editable, created_at)
VALUES (9, 5, 'header', 'string', FALSE, FALSE, FALSE, FALSE, NOW());

-- 10. header + array
INSERT INTO parameter_rule (parameter_rule_id, operation_field_rule_id, in_type, data_type, supports_enum,
                            supports_array, is_required, is_editable, created_at)
VALUES (10, 5, 'header', 'array', FALSE, TRUE, FALSE, FALSE, NOW());

-- 11. cookie + string
INSERT INTO parameter_rule (parameter_rule_id, operation_field_rule_id, in_type, data_type, supports_enum,
                            supports_array, is_required, is_editable, created_at)
VALUES (11, 5, 'cookie', 'string', FALSE, FALSE, FALSE, FALSE, NOW());

-- 12. cookie + array
INSERT INTO parameter_rule (parameter_rule_id, operation_field_rule_id, in_type, data_type, supports_enum,
                            supports_array, is_required, is_editable, created_at)
VALUES (12, 5, 'cookie', 'array', FALSE, TRUE, FALSE, FALSE, NOW());

-- 1. JSON 객체 요청
INSERT INTO request_rule (request_rule_id, operation_field_rule_id, content_type, body_type, required,
                          supports_file, allowed_fields, created_at, updated_at)
VALUES (1, 6, 'application/json', 'object', true, false, '["title", "content", "tags"]', NOW(), NOW());

-- 2. JSON 배열 요청
INSERT INTO request_rule (request_rule_id, operation_field_rule_id, content_type, body_type, required,
                          supports_file, allowed_fields, created_at, updated_at)
VALUES (2, 6, 'application/json', 'array', true, false, '["users", "items"]', NOW(), NOW());

-- 3. 단일 필드 문자열 요청 (string)
INSERT INTO request_rule (request_rule_id, operation_field_rule_id, content_type, body_type, required,
                          supports_file, allowed_fields, created_at, updated_at)
VALUES (3, 6, 'application/json', 'string', false, false, '["message"]', NOW(), NOW());

-- 4. 파일 업로드 (multipart)
INSERT INTO request_rule (request_rule_id, operation_field_rule_id, content_type, body_type, required,
                          supports_file, allowed_fields, created_at, updated_at)
VALUES (4, 6, 'multipart/form-data', 'object', true, true, '["file", "description"]', NOW(), NOW());

-- 5. x-www-form-urlencoded
INSERT INTO request_rule (request_rule_id, operation_field_rule_id, content_type, body_type, required,
                          supports_file, allowed_fields, created_at, updated_at)
VALUES (5, 6, 'application/x-www-form-urlencoded', 'object', true, false, '["email", "password"]', NOW(), NOW());


-- 200 OK
INSERT INTO response_rule (response_rule_id, operation_field_rule_id, status_code, description, content_type,
                           schema_type, ref_component, is_error, created_at, updated_at)
VALUES (1, 7, '200', '성공적으로 처리됨', 'application/json', 'object', '#/components/schemas/SuccessResponse', false, NOW(),
        NOW());

-- 201 Created
INSERT INTO response_rule (response_rule_id, operation_field_rule_id, status_code, description, content_type,
                           schema_type, ref_component, is_error, created_at, updated_at)
VALUES (2, 7, '201', '리소스가 생성됨', 'application/json', 'object', '#/components/schemas/SuccessResponse', false, NOW(),
        NOW());

-- 204 No Content
INSERT INTO response_rule (response_rule_id, operation_field_rule_id, status_code, description, content_type,
                           schema_type, ref_component, is_error, created_at, updated_at)
VALUES (3, 7, '204', '응답 본문 없음', NULL, NULL, NULL, false, NOW(), NOW());

-- 400 Bad Request
INSERT INTO response_rule (response_rule_id, operation_field_rule_id, status_code, description, content_type,
                           schema_type, ref_component, is_error, created_at, updated_at)
VALUES (4, 7, '400', '잘못된 요청입니다.', 'application/json', 'object', '#/components/schemas/ErrorResponse', true, NOW(),
        NOW());

-- 401 Unauthorized
INSERT INTO response_rule (response_rule_id, operation_field_rule_id, status_code, description, content_type,
                           schema_type, ref_component, is_error, created_at, updated_at)
VALUES (5, 7, '401', '인증이 필요합니다.', 'application/json', 'object', '#/components/schemas/ErrorResponse', true, NOW(),
        NOW());

-- 403 Forbidden
INSERT INTO response_rule (response_rule_id, operation_field_rule_id, status_code, description, content_type,
                           schema_type, ref_component, is_error, created_at, updated_at)
VALUES (6, 7, '403', '접근 권한이 없습니다.', 'application/json', 'object', '#/components/schemas/ErrorResponse', true, NOW(),
        NOW());

-- 500 Internal Server Error
INSERT INTO response_rule (response_rule_id, operation_field_rule_id, status_code, description, content_type,
                           schema_type, ref_component, is_error, created_at, updated_at)
VALUES (7, 7, '500', '서버 오류가 발생했습니다.', 'application/json', 'object', '#/components/schemas/ErrorResponse', true, NOW(),
        NOW());
