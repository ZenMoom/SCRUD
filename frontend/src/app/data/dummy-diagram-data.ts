// data/dummy-diagram-data.ts
export const dummyDiagramData = {
  diagramId: "diagram-123",
  components: [
    {
      componentId: "component-123",
      type: "CLASS",
      name: "BoardController",
      description: "게시판 컨트롤러 클래스",
      positionX: -100,
      positionY: 0,
      methods: [
        {
          methodId: "method-456",
          name: "getAllPosts",
          signature: "public ResponseEntity<PageDto<PostDto>> getAllPosts(Pageable pageable)",
          body: "@GetMapping\npublic ResponseEntity<PageDto<PostDto>> getAllPosts(Pageable pageable) {\n    return ResponseEntity.ok(boardService.getAllPosts(pageable));\n}",
          description: "모든 게시글을 페이징하여 조회합니다.",
        },
        {
          methodId: "method-457",
          name: "getPostById",
          signature: "public ResponseEntity<PostDto> getPostById(Long postId)",
          body: '@GetMapping("/{postId}")\npublic ResponseEntity<PostDto> getPostById(@PathVariable Long postId) {\n    return ResponseEntity.ok(boardService.getPostById(postId));\n}',
          description: "특정 ID의 게시글을 조회합니다.",
        },
      ],
    },
    {
      componentId: "component-124",
      type: "CLASS",
      name: "BoardService",
      description: "게시판 서비스 클래스",
      positionX: 400,
      positionY: 0,
      methods: [
        {
          methodId: "method-458",
          name: "getAllPosts",
          signature: "public PageDto<PostDto> getAllPosts(Pageable pageable)",
          body: "public PageDto<PostDto> getAllPosts(Pageable pageable) {\n    Page<Post> postsPage = postRepository.findAll(pageable);\n    List<PostDto> postDtos = postsPage.getContent().stream()\n        .map(this::convertToDto)\n        .collect(Collectors.toList());\n    \n    return new PageDto<>(postDtos, postsPage.getNumber(), postsPage.isFirst(), postsPage.isLast(), \n        postsPage.getTotalPages(), postsPage.getTotalElements());\n}",
          description: "모든 게시글을 페이징하여 조회합니다.",
        },
        {
          methodId: "method-459",
          name: "getPostById",
          signature: "public PostDto getPostById(Long postId)",
          body: 'public PostDto getPostById(Long postId) {\n    Post post = postRepository.findById(postId)\n        .orElseThrow(() -> new NotFoundException("Post not found with id: " + postId));\n    return convertToDto(post);\n}',
          description: "특정 ID의 게시글을 조회합니다.",
        },
      ],
    },
    {
      componentId: "component-125",
      type: "INTERFACE",
      name: "PostRepository",
      description: "게시글 저장소 인터페이스",
      positionX: 900,
      positionY: 0,
      methods: [
        {
          methodId: "method-460",
          name: "findAll",
          signature: "Page<Post> findAll(Pageable pageable)",
          description: "모든 게시글을 페이징하여 조회합니다.",
        },
        {
          methodId: "method-461",
          name: "findById",
          signature: "Optional<Post> findById(Long id)",
          description: "ID로 게시글을 조회합니다.",
        },
      ],
    },
  ],
  connections: [
    {
      connectionId: "connection-123",
      sourceMethodId: "method-456",
      targetMethodId: "method-458",
      type: "SOLID",
    },
    {
      connectionId: "connection-124",
      sourceMethodId: "method-457",
      targetMethodId: "method-459",
      type: "SOLID",
    },
    {
      connectionId: "connection-125",
      sourceMethodId: "method-458",
      targetMethodId: "method-460",
      type: "DOTTED",
    },
    {
      connectionId: "connection-126",
      sourceMethodId: "method-459",
      targetMethodId: "method-461",
      type: "DOTTED",
    },
  ],
  dto: [
    {
      dtoId: "dto-123",
      name: "PostDto",
      description: "게시글 DTO",
      body: "public class PostDto {\n    private Long id;\n    private String title;\n    private String content;\n    private String author;\n    private LocalDateTime createdAt;\n    private LocalDateTime updatedAt;\n    \n    // getters and setters\n}",
    },
    {
      dtoId: "dto-124",
      name: "PageDto",
      description: "페이지 DTO",
      body: "public class PageDto<T> {\n    private List<T> content;\n    private int listSize;\n    private boolean isFirstPage;\n    private boolean isLastPage;\n    private int totalPages;\n    private long totalElements;\n    \n    // constructors, getters and setters\n}",
    },
  ],
  metadata: {
    metadataId: "metadata-123",
    version: "1.0.0",
    lastModified: "2025-04-25T10:30:45.123Z",
    name: "게시판 API",
    description: "게시판 서비스를 위한 CRUD API 모음",
  },
}
