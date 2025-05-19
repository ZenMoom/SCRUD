from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

CONNECTION_SYSTEM_TEMPLATE = """
컴포넌트 데이터를 분석하고 다음 규칙에 따라 논리적인 커넥션을 생성하세요:

1. Connection의 sourceMethodId는 Controller 클래스부터 시작됩니다.
2. 메서드 본문(body)을 분석하여 해당 메서드가 다른 메서드를 직접 호출하는 경우에만 커넥션을 생성하세요
3. 메서드 A의 본문에서 메서드 B를 호출하고 있고, 메서드 B가 현재 입력된 컴포넌트 목록에 존재하는 경우에만 A에서 B로의 커넥션을 생성하세요
4. 메서드 간의 호출 관계는 다음 순서를 따라야 합니다: Controller -> Converter -> Service -> Repository
6. 메서드 본문에서 직접적인 호출 관계가 확인되는 경우 SOLID 타입으로, 인터페이스와 같은 간접적인 관계는 DOTTED 타입으로 연결하세요
7. 각 메서드의 본문에서 클래스 이름과 메서드 이름을 함께 확인하여 정확한 호출 관계를 파악하세요 (예: boardService.getPostById()는 BoardService 클래스의 getPostById 메서드를 호출함)

입력된 컴포넌트 간의 관계를 아래 예시와 같이 분석하여 논리적 순서에 맞는 커넥션을 생성하세요.

[예시 입력]

{{
    "components": [
    {{
      "type": "CLASS",
      "name": "BoardController",
      "description": "게시판 컨트롤러 클래스",
      "positionX": 0,
      "positionY": 0,
      "methods": [
        {{
          "methodId": "741a3b01-9c59-4879-8c16-1d0f92542db5",
          "name": "getPostById",
          "signature": "public ResponseEntity<PostDto> getPostById(Long postId)",
          "body": "
            @GetMapping("/postId")
            public ResponseEntity<PostDto> getPostById(@PathVariable Long postId) {{
                return ResponseEntity.ok(boardService.getPostById(postId));
            }}",
          "description": "특정 ID의 게시글을 조회합니다."
        }}
      ]
    }},
    {{
      "type": "CLASS",
      "name": "BoardService",
      "description": "게시판 서비스 클래스",
      "positionX": 500.0,
      "positionY": 0.0,
      "methods": [
        {{
          "methodId": "de71c3c6-9f6e-4bcf-a29d-753bf0586934",
          "name": "getPostById",
          "signature": "public PostDto getPostById(Long postId)",
          "body": "
          public PostDto getPostById(Long postId) {{
            Post post = postRepository.findById(postId).orElseThrow(() -> new NotFoundException(\\"Post not found with id: \\" + postId));
            return convertToDto(post);
          }}",
          "description": "특정 ID의 게시글을 조회합니다."
        }}
      ]
    }},
    {{
      "type": "INTERFACE",
      "name": "PostRepository",
      "description": "게시글 저장소 인터페이스",
      "positionX": 1000.0,
      "positionY": 0.0,
      "methods": [
        {{
          "methodId": "fc1c4558-2c9b-4ef8-9792-20603a0b59aa",
          "name": "findById",
          "signature": "Optional<Post> findById(Long id)",
          "body": "Optional<Post> findById(Long id);",
          "description": "ID로 게시글을 조회합니다."
        }}
      ]
    }}
    ]
}}

[예시 출력]
{{
    "connections": [
        {{
          "sourceMethodId": "741a3b01-9c59-4879-8c16-1d0f92542db5",
          "targetMethodId": "de71c3c6-9f6e-4bcf-a29d-753bf0586934",
          "type": "SOLID"
        }},
        {{
          "sourceMethodId": "de71c3c6-9f6e-4bcf-a29d-753bf0586934",
          "targetMethodId": "fc1c4558-2c9b-4ef8-9792-20603a0b59aa",
          "type": "SOLID"
        }}
    ]
}}

[응답 지침]
{output_instructions}
"""

CONNECTION_HUMAN_TEMPLATE = """
[컴포넌트 데이터]
{connection_schema}
"""

def get_connection_prompt():
    return ChatPromptTemplate(
        input_variables=["connection_schema", "output_instructions"],
        messages=[
            SystemMessagePromptTemplate.from_template(template=CONNECTION_SYSTEM_TEMPLATE),
            HumanMessagePromptTemplate.from_template(template=CONNECTION_HUMAN_TEMPLATE)
        ]
    )

