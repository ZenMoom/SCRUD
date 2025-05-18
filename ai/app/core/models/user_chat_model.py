from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict

from app.core.models.diagram_model import MethodChainPayload


def get_example():
    return """
    네, Spring Web MVC를 사용하여 게시판 ID로 게시글을 조회하는 API를 구현하겠습니다. 주어진 명세에 따라 코드를 작성해 드리겠습니다.

    먼저 필요한 클래스들을 모듈별로 나누어 구현하겠습니다:

    1. 엔티티 클래스
    2. DTO 클래스
    3. Repository 인터페이스
    4. Service 클래스
    5. Controller 클래스

    각 모듈을 차례대로 구현해 보겠습니다.

    ## 1. 엔티티 클래스

    ```java
    // User.java
    @Entity
    @Table(name = "users")
    @Getter @Setter
    public class User {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(nullable = false, unique = true, length = 50)
        private String username;

        @Column(nullable = false)
        private String password;

        @Column(nullable = false, unique = true, length = 100)
        private String email;
    }
    ```

    ```java
    // Post.java
    @Entity
    @Table(name = "posts")
    @Getter @Setter
    public class Post {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(nullable = false, length = 200)
        private String title;

        @Column(nullable = false, columnDefinition = "TEXT")
        private String content;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", nullable = false)
        private User user;

        @Column(name = "view_count", columnDefinition = "integer default 0")
        private Integer viewCount = 0;

        @Column(name = "is_deleted", columnDefinition = "boolean default false")
        private Boolean isDeleted = false;
    }
    ```

    ## 2. DTO 클래스

    ```java
    // PostResponseDto.java
    @Getter
    @Builder
    public class PostResponseDto {
        private Long id;
        private String title;
        private String content;
        private AuthorDto author;
        private Integer viewCount;
        private Boolean isDeleted;

        @Getter
        @Builder
        public static class AuthorDto {
            private Long id;
            private String name;
        }
    }
    ```

    ## 3. Repository 인터페이스

    ```java
    // PostRepository.java
    public interface PostRepository extends JpaRepository<Post, Long> {

        @Query("SELECT p FROM Post p JOIN FETCH p.user WHERE p.id = :id AND (:includeDeleted = true OR p.isDeleted = false)")
        Optional<Post> findByIdWithUser(@Param("id") Long id, @Param("includeDeleted") boolean includeDeleted);
    }
    ```

    ## 4. Service 클래스

    ```java
    // PostService.java
    @Service
    @RequiredArgsConstructor
    @Slf4j
    public class PostService {

        private final PostRepository postRepository;

        @Transactional
        public PostResponseDto getPostById(Long boardId, boolean includeDeleted) {
            log.info("게시글 조회 요청 - 게시글 ID: {}, 삭제된 게시글 포함 여부: {}", boardId, includeDeleted);

            Post post = postRepository.findByIdWithUser(boardId, includeDeleted)
                    .orElseThrow(() -> {
                        log.error("게시글을 찾을 수 없음 - 게시글 ID: {}", boardId);
                        return new IllegalArgumentException("해당 게시글을 찾을 수 없습니다. ID: " + boardId);
                    });

            // 조회수 증가
            post.setViewCount(post.getViewCount() + 1);

            log.info("게시글 조회 성공 - 게시글 ID: {}, 제목: {}", post.getId(), post.getTitle());

            return PostResponseDto.builder()
                    .id(post.getId())
                    .title(post.getTitle())
                    .content(post.getContent())
                    .author(PostResponseDto.AuthorDto.builder()
                            .id(post.getUser().getId())
                            .name(post.getUser().getUsername())
                            .build())
                    .viewCount(post.getViewCount())
                    .isDeleted(post.getIsDeleted())
                    .build();
        }
    }
    ```

    ## 5. Controller 클래스

    ```java
    // BoardController.java
    @RestController
    @RequestMapping("/api/v1/boards")
    @RequiredArgsConstructor
    @Slf4j
    public class BoardController {

        private final PostService postService;

        @GetMapping("/{boardId}")
        public ResponseEntity<PostResponseDto> getBoardById(
                @PathVariable Long boardId,
                @RequestParam(required = false, defaultValue = "false") boolean includeDeleted) {

            log.info("게시글 조회 API 호출 - 게시글 ID: {}, 삭제된 게시글 포함 여부: {}", boardId, includeDeleted);

            PostResponseDto postResponse = postService.getPostById(boardId, includeDeleted);

            log.info("게시글 조회 API 응답 완료 - 게시글 ID: {}", boardId);

            return ResponseEntity.ok(postResponse);
        }
    }
    ```
    """


class UserChatChainPayload(BaseModel):
    class MethodPromptTargetEnum(str, Enum):
        """메서드 프롬프트 대상 유형을 정의하는 열거형"""
        SIGNATURE = "SIGNATURE"  # 메서드 서명(파라미터, 반환 타입 등)을 대상으로 함
        BODY = "BODY"  # 메서드 본문(구현 내용)을 대상으로 함

    class MethodPromptTagEnum(str, Enum):
        """사용자의 요청 유형을 분류하는 태그 열거형"""
        EXPLAIN = "EXPLAIN"  # 코드 설명 요청
        REFACTORING = "REFACTORING"  # 코드 리팩토링 요청
        OPTIMIZE = "OPTIMIZE"  # 코드 최적화 요청
        DOCUMENT = "DOCUMENT"  # 문서화 요청
        TEST = "TEST"  # 테스트 코드 생성 요청
        SECURITY = "SECURITY"  # 보안 관련 개선 요청
        CONVENTION = "CONVENTION"  # 코딩 컨벤션 적용 요청
        ANALYZE = "ANALYZE"  # 코드 분석 요청
        IMPLEMENT = "IMPLEMENT"  # 기능 구현 요청

    tag: Optional[MethodPromptTagEnum] = Field(None, description="사용자 요청의 유형 태그(설명, 리팩토링, 최적화 등)")
    promptType: Optional[MethodPromptTargetEnum] = Field(None, description="요청 대상 유형(메서드 시그니처 또는 본문)")
    message: Optional[str] = Field(None, description="사용자가 입력한 메시지 내용")
    targetMethods: List[MethodChainPayload] = Field([], description="작업 대상 메서드 목록")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "tag": "IMPLEMENT",
                "promptType": "SIGNATURE",
                "message": "API 하나를 새로 구현해주세요.",
                "targetMethods": [
                    {
                        "name": "getUserById",
                        "signature": "getUserById(id: string): User",
                        "body": "return this.userRepository.findById(id);",
                        "description": "주어진 ID로 사용자 정보를 조회하는 메서드"
                    }
                ]
            }
        }
    )


class SystemChatChainPayload(BaseModel):
    class PromptResponseEnum(str, Enum):
        """시스템 응답 상태를 나타내는 열거형"""
        MODIFIED = "MODIFIED"  # 코드가 수정됨
        UNCHANGED = "UNCHANGED"  # 코드가 변경되지 않음
        EXPLANATION = "EXPLANATION"  # 설명만 제공
        MODIFIED_WITH_NEW_COMPONENTS = "MODIFIED_WITH_NEW_COMPONENTS"  # 새 컴포넌트가 추가된 수정
        ERROR = "ERROR"  # 오류 발생

    status: Optional[PromptResponseEnum] = Field(None, description="시스템 응답 상태(수정됨, 변경 없음, 설명, 오류 등)")
    message: Optional[str] = Field(None, description="시스템 응답 메시지 내용")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "status": "MODIFIED",
                "message": get_example()
            }
        }
    )


class ChatChainPayload(BaseModel):
    userChat: Optional[UserChatChainPayload] = Field(None, description="사용자 채팅 요청 정보")
    systemChat: Optional[SystemChatChainPayload] = Field(None, description="시스템 응답 정보")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "userChat": {
                    "tag": "OPTIMIZE",
                    "promptType": "BODY",
                    "message": "이 코드를 최적화해주세요."
                },
                "systemChat": {
                    "status": "MODIFIED",
                    "message": "코드가 최적화되었습니다."
                }
            }
        }
    )
