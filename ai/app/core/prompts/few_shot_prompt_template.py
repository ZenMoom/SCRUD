from langchain.output_parsers import PydanticOutputParser, JsonOutputToolsParser
from langchain.prompts import PromptTemplate, FewShotPromptTemplate

from app.core.models.prompt_models import Diagram

# Pydantic 출력 파서 설정
parser = PydanticOutputParser(pydantic_object=Diagram)
print(parser.get_format_instructions())
# 샘플 데이터 준비 (Few-shot learning을 위한 예시)
examples = [
    {
        "openapi_spec": """
        openapi: 3.0.0
        info:
        title: 게시판 API
        description: 게시판 서비스를 위한 CRUD API 모음
        version: 1.0.0
        paths:
        /api/posts:
        get:
          summary: 게시글 목록 조회
          responses:
            '200':
              description: 성공
        post:
          summary: 게시글 등록
          responses:
            '201':
              description: 생성됨
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
    "diagramId": "diagram-001",
    "metadata": {{
      "version": "1.0.0",
      "lastModified": "2025-04-25T10:30:45.123Z",
      "name": "게시판 API",
      "description": "게시판 서비스를 위한 CRUD API 모음"
    }},
    "connections": [
    {{
      "connectionId": "connection-001",
      "sourceMethodId": "method-001",
      "targetMethodId": "method-004",
      "type": "SOLID"
    }},
    {{
      "connectionId": "connection-002",
      "sourceMethodId": "method-002",
      "targetMethodId": "method-005",
      "type": "SOLID"
    }},
    {{
      "connectionId": "connection-003",
      "sourceMethodId": "method-003",
      "targetMethodId": "method-006",
      "type": "SOLID"
    }},
    {{
      "connectionId": "connection-004",
      "sourceMethodId": "method-004",
      "targetMethodId": "method-007",
      "type": "DOTTED"
    }},
    {{
      "connectionId": "connection-005",
      "sourceMethodId": "method-005",
      "targetMethodId": "method-008",
      "type": "DOTTED"
    }},
    {{
      "connectionId": "connection-006",
      "sourceMethodId": "method-006",
      "targetMethodId": "method-009",
      "type": "DOTTED"
    }}
    ],
    "dto": [
    {{
      "dtoId": "dto-001",
      "name": "PostDto",
      "description": "게시글 DTO",
      "body": "public class PostDto {{\\n    private Long id;\\n    private String title;\\n    private String content;\\n    private String author;\\n    private LocalDateTime createdAt;\\n    private LocalDateTime updatedAt;\\n    \\n    // getters and setters\\n}}"
    }},
    {{
      "dtoId": "dto-002",
      "name": "PageDto",
      "description": "페이지 DTO",
      "body": "public class PageDto<T> {{\\n    private List<T> content;\\n    private int listSize;\\n    private boolean isFirstPage;\\n    private boolean isLastPage;\\n    private int totalPages;\\n    private long totalElements;\\n    \\n    // constructors, getters and setters\\n}}"
    }},
    {{
      "dtoId": "dto-003",
      "name": "PostCreateDto",
      "description": "게시글 생성 DTO",
      "body": "public class PostCreateDto {{\\n    private String title;\\n    private String content;\\n    private String author;\\n    \\n    // getters and setters\\n}}"
    }}
    ],
    "components": [
    {{
      "componentId": "class-001",
      "type": "CLASS",
      "name": "BoardController",
      "description": "게시판 컨트롤러 클래스",
      "positionX": 250.5,
      "positionY": 150.75,
      "methods": [
        {{
          "methodId": "method-001",
          "name": "getAllPosts",
          "signature": "public ResponseEntity<PageDto<PostDto>> getAllPosts(Pageable pageable)",
          "body": "
            @GetMapping
            public ResponseEntity<PageDto<PostDto>> getAllPosts(Pageable pageable) {{
                return ResponseEntity.ok(boardService.getAllPosts(pageable));
            }}",
          "description": "모든 게시글을 페이징하여 조회합니다."
        }},
        {{
          "methodId": "method-002",
          "name": "getPostById",
          "signature": "public ResponseEntity<PostDto> getPostById(Long postId)",
          "body": "
            @GetMapping("/postId")
            public ResponseEntity<PostDto> getPostById(@PathVariable Long postId) {{
                return ResponseEntity.ok(boardService.getPostById(postId));
            }}",
          "description": "특정 ID의 게시글을 조회합니다."
        }},
        {{
          "methodId": "method-003",
          "name": "createPost",
          "signature": "public ResponseEntity<PostDto> createPost(PostCreateDto postCreateDto)",
          "body": "
          @PostMapping
          public ResponseEntity<PostDto> createPost(@RequestBody PostCreateDto postCreateDto) {{
              return ResponseEntity.status(HttpStatus.CREATED).body(boardService.createPost(postCreateDto));
          }}",
          "description": "새로운 게시글을 등록합니다."
        }}
      ]
    }},
    {{
      "componentId": "class-002",
      "type": "CLASS",
      "name": "BoardService",
      "description": "게시판 서비스 클래스",
      "positionX": 450.0,
      "positionY": 150.0,
      "methods": [
        {{
          "methodId": "method-004",
          "name": "getAllPosts",
          "signature": "public PageDto<PostDto> getAllPosts(Pageable pageable)",
          "body": "
          public PageDto<PostDto> getAllPosts(Pageable pageable) {{
            Page<Post> postsPage = postRepository.findAll(pageable);
            List<PostDto> postDtos = postsPage.getContent().stream().map(this::convertToDto).collect(Collectors.toList());
                return new PageDto<>(postDtos, postsPage.getNumber(), postsPage.isFirst(), postsPage.isLast(), postsPage.getTotalPages(), postsPage.getTotalElements());
          }}",
          "description": "모든 게시글을 페이징하여 조회합니다."
        }},
        {{
          "methodId": "method-005",
          "name": "getPostById",
          "signature": "public PostDto getPostById(Long postId)",
          "body": "
          public PostDto getPostById(Long postId) {{
            Post post = postRepository.findById(postId).orElseThrow(() -> new NotFoundException(\\"Post not found with id: \\" + postId));
            return convertToDto(post);
          }}",
          "description": "특정 ID의 게시글을 조회합니다."
        }},
        {{
          "methodId": "method-006",
          "name": "createPost",
          "signature": "public PostDto createPost(PostCreateDto postCreateDto)",
          "body": "
          public PostDto createPost(PostCreateDto postCreateDto) {{
            Post post = new Post();
            post.setTitle(postCreateDto.getTitle());
            post.setContent(postCreateDto.getContent());
            post.setAuthor(postCreateDto.getAuthor());
            post.setCreatedAt(LocalDateTime.now());
            Post savedPost = postRepository.save(post);
            return convertToDto(savedPost);
          }}",
          "description": "새로운 게시글을 등록합니다."
        }}
      ]
    }},
    {{
      "componentId": "class-003",
      "type": "INTERFACE",
      "name": "PostRepository",
      "description": "게시글 저장소 인터페이스",
      "positionX": 650.0,
      "positionY": 150.0,
      "methods": [
        {{
          "methodId": "method-007",
          "name": "findAll",
          "signature": "Page<Post> findAll(Pageable pageable)",
          "body":"Page<Post> findAll(Pageable pageable);",
          "description": "모든 게시글을 페이징하여 조회합니다."
        }},
        {{
          "methodId": "method-008",
          "name": "findById",
          "signature": "Optional<Post> findById(Long id)",
          "body": "Optional<Post> findById(Long id);",
          "description": "ID로 게시글을 조회합니다."
        }},
        {{
          "methodId": "method-009",
          "name": "save",
          "signature": "Post save(Post post)",
          "body: "Post save(Post post);",
          "description": "게시글을 저장합니다."
        }}
      ]
    }}
    ]
}}
        """
    }
]

# FewShot 프롬프트 템플릿 생성
example_formatter_template = """
input(OpenAPI 명세):
{openapi_spec}

output(도식화 데이터):
{diagram}
"""

example_prompt = PromptTemplate(
    input_variables=["openapi_spec", "diagram"],
    template=example_formatter_template
)

few_shot_prompt = FewShotPromptTemplate(
    examples=examples,
    example_prompt=example_prompt,
    prefix="""주어진 OpenAPI 명세를 분석하여 메서드 도식화 데이터를 생성해야 합니다.
아래는 OpenAPI 명세와 그에 해당하는 도식화 데이터의 예시입니다. 이 예시를 참고하여 새로운 OpenAPI 명세에 맞는 도식화 데이터를 생성해주세요.

도식화 데이터는 다음과 같은 구성요소를 포함해야 합니다:
1. 클래스와 인터페이스 컴포넌트
2. 각 컴포넌트의 메서드
3. 메서드 간의 연결 관계
4. DTO 모델
5. 메타데이터

도식화 데이터는 Spring Boot 아키텍처 패턴을 따르며, 일반적으로 Controller, Service, Repository 컴포넌트를 포함합니다.
각 메서드는 OpenAPI 명세의 Path와 Operation을 기반으로 생성되며, 적절한 구현 내용을 포함해야 합니다.

응답 JSON의 바디에 $ref를 사용하지마세요.

당신은 Pydantic과 JSON 스키마 구조를 이해하고 처리해야 합니다. 특히 다음 정보를 숙지하세요:

1. JSON 스키마에서 `$defs` 키워드는 스키마 내부에서 재사용 가능한 정의를 저장하는 표준 컨테이너입니다. 이전 JSON 스키마 버전에서는 `definitions`라고 불렸으나, Draft 2020-12부터 `$defs`로 변경되었습니다.
2. `$defs` 내부의 항목들은 `$ref` 키워드를 통해 참조됩니다. 예: `{{"$ref": "#/$defs/ComponentType"}}`는 `$defs` 안에 정의된 "ComponentType" 스키마를 참조합니다.
3. Pydantic이 복잡한 중첩 모델을 JSON 스키마로 변환할 때, 모델의 타입 정의를 `$defs` 섹션에 분리하여 저장하고 메인 스키마에서는 참조를 사용합니다.
4. 이러한 구조는 스키마의 가독성을 높이고, 중복을 줄이며, 순환 참조 문제를 해결하기 위한 설계입니다.
""",
    suffix="""이제 아래 OpenAPI 명세를 분석하여 도식화 데이터를 생성해주세요.

OpenAPI 명세:
{openapi_spec}

형식에 맞게 JSON 형태로 도식화 데이터를 출력해주세요.""",
    input_variables=["openapi_spec"]
)

# 프롬프트 저장
few_shot_prompt.save("few_shot_prompt.json")