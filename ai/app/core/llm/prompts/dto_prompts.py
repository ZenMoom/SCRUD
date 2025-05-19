from langchain.prompts import PromptTemplate

DTO_MODEL_TEMPLATE = """
아래 지침에 따라 API 정보와 메서드 데이터를 분석하여 정확한 DTO 클래스를 생성하세요:

[지침]
1. DTO 이름 분석:
   - 메서드 시그니처와 본문에서 사용되는 DTO 클래스 이름을 분석하세요.
   - 메서드 파라미터나 반환 타입에 명시된 DTO 이름을 우선적으로 사용하세요.
   - API의 endpoint, httpMethod, summary를 분석하여 적절한 DTO 이름을 추론하세요. 
   - 예: 'POST /api/users'는 CreateUserRequest, 'GET /api/users/{{id}}'는 UserResponse 등으로 유추합니다.

2. DTO 필드 분석:
   - API 정보의 requestBody, response, pathParameters, queryParameters에서 필드 정보를 가져오세요.
   - 각 필드의 이름과 타입을 정확히 매핑하세요 (예: "id":"integer" → private Long id).
   - Java 타입 매핑: "string" → String, "integer" → Integer/Long, "boolean" → Boolean, "array" → List<T>, "object" → 중첩 클래스
   
3. Validation 설정:
   - API 설명(description)을 분석하여 필드에 검증이 필요한지 결정하세요.
   - 다음 키워드가 포함된 경우 해당 검증 어노테이션을 추가하세요:
     - "필수", "required", "must" → @NotNull
     - "이메일", "email" → @Email
     - "최소", "minimum", "min" → @Min
     - "최대", "maximum", "max" → @Max
     - "길이", "length" → @Size
     - "양수", "positive" → @Positive
     - "숫자만", "digits", "numeric" → @Digits
     - "패턴", "pattern" → @Pattern
   - 이름에 "Id"가 포함된 필드는 @NotNull 검증을 기본으로 추가하세요.

4. 어노테이션 설정:
   - 모든 DTO 클래스에 @Data, @Builder 어노테이션을 추가하세요.
   - 요청 DTO의 경우 @NoArgsConstructor, @AllArgsConstructor 어노테이션을 추가하세요.
   - 응답 DTO의 경우 @AllArgsConstructor 어노테이션만 추가하세요.
   - 날짜/시간 필드에는 @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") 어노테이션을 추가하세요.

5. 케이스 변환:
   - API 응답 필드가 snake_case(예: user_id)인 경우, DTO 필드는 camelCase(예: userId)로 변환하세요.

6. 중첩 DTO 처리:
   - 복잡한 객체 구조가 있는 경우 중첩 클래스로 정의하세요.
   - 배열 타입의 경우 제네릭 타입을 명시하세요 (예: List<CommentDto>).

[API 정보]
{api_spec}

[메서드 정보]
{components_prompt}

[응답 지침]
{output_instructions}
"""

DTO_MODEL_HUMAN_TEMPLATE = """
DTO 모델을 생성해주세요
"""


def get_dto_prompt():
    return PromptTemplate(
        input_variables=[
            "api_spec",
            "components_prompt",
            "output_instructions"
        ],
        template=DTO_MODEL_TEMPLATE
    )
