from typing import Dict, List


def prepare_diagram_examples() -> List[Dict[str, str]]:
    """
    Few-shot learning을 위한 예시 데이터를 준비하는 메서드

    Returns:
        list: 예시 데이터 목록
    """
    return [{
        "openapi_spec": """
            openapi: 3.0.0
            info:
            title: 게시판 API
            description: 게시판 서비스를 위한 CRUD API 모음
            version: 1.0.0
            paths:
              /api/posts/{{postId}}:
              get:
                summary: 게시글 조회
                parameters:
                  - name: postId
                    in: path
                    required: true
                    schema:
                      type: integer
                responses:
                  '200':
                    description: 성공
                    """,
        "diagram": """
    {{
        "diagramId": "b2a1d7d5-551b-4d8f-ab78-bcd9bcde7950",
        "metadata": {{
          "metadataId": "b2a1d7d5-551b-4d8f-ab78-bcd9bcde7950",
          "version": 1,
          "lastModified": "2025-04-25T10:30:45.123Z",
          "name": "메서드 구현",
          "description": "게시글 조회 API를 구현했습니다."
        }},
        "connections": [
        {{
          "connectionId": "6901aeb2-59f6-4f38-9b2a-aa93ab53dd74",
          "sourceMethodId": "741a3b01-9c59-4879-8c16-1d0f92542db5",
          "targetMethodId": "de71c3c6-9f6e-4bcf-a29d-753bf0586934",
          "type": "SOLID"
        }},
        {{
          "connectionId": "69afac2d-c323-4424-bc43-948cb73148c0",
          "sourceMethodId": "de71c3c6-9f6e-4bcf-a29d-753bf0586934",
          "targetMethodId": "fc1c4558-2c9b-4ef8-9792-20603a0b59aa",
          "type": "SOLID"
        }}
        ],
        "dto": [
        {{
          "dtoId": "cc21d47e-d752-416b-a96c-63f90329bcc2",
          "name": "PostDto",
          "description": "게시글 DTO",
          "body": "public class PostDto {{\\n    private Long id;\\n    private String title;\\n    private String content;\\n    private String author;\\n    private LocalDateTime createdAt;\\n    private LocalDateTime updatedAt;\\n    \\n    // getters and setters\\n}}"
        }},
        ],
        "components": [
        {{
          "componentId": "84322822-22bc-4d00-bcb0-826328a2ed20",
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
          "componentId": "26385baf-55b1-4636-9f12-5aa83c4408a4",
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
          "componentId": "7f75b4d4-6e7b-4e70-b119-e777a0aed731",
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
"""
    }]


def prepare_diagram_examples_prefix() -> str:
    return """주어진 OpenAPI 명세를 분석하여 메서드 도식화 데이터를 생성해야 합니다.
아래는 OpenAPI 명세와 그에 해당하는 도식화 데이터의 예시입니다. 이 예시를 참고하여 새로운 OpenAPI 명세에 맞는 도식화 데이터를 생성해주세요.

도식화 데이터는 다음과 같은 구성요소를 포함해야 합니다:
1. 클래스와 인터페이스 컴포넌트
2. 각 컴포넌트의 메서드
3. 메서드 간의 연결 관계
4. DTO 모델
5. 메타데이터

도식화 데이터는 Spring Boot 아키텍처 패턴을 따르며, 일반적으로 Controller, Service, Repository 컴포넌트를 포함합니다.
각 메서드는 OpenAPI 명세의 Path와 Operation을 기반으로 생성되며, 적절한 구현 내용을 포함해야 합니다.


"""


def prepare_diagram_examples_suffix() -> str:
    return """이제 아래 OpenAPI 명세를 분석하여 도식화 데이터를 생성해주세요.

    OpenAPI 명세:
    {openapi_spec}

    형식에 맞게 JSON 형태로 도식화 데이터를 출력해주세요."""
