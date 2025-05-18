from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

CONNECTION_SYSTEM_TEMPLATE = """
컴포넌트 데이터를 보고 커넥션을 생성하세요 예시를 보고 생성해주세요

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

