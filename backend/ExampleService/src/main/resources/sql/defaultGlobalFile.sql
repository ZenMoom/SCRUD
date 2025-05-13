SET SQL_SAFE_UPDATES=0;

-- 트랜잭션 시작
BEGIN;


INSERT INTO default_global_files (file_name, file_type, file_content, created_at, updated_at)
VALUES (
           'MSA아키텍처',
           'ARCHITECTURE_DEFAULT_MSA',
           'com.example.userservice.controller.UserController
 com.example.userservice.dto.UserResponseDto
 com.example.userservice.service.UserService
 com.example.userservice.repository.UserRepository
 com.example.userservice.domain.User
 com.example.userservice.application.UserServiceApplication

 com.example.orderservice.controller.OrderController
 com.example.orderservice.dto.OrderRequestDto
 com.example.orderservice.service.OrderService
 com.example.orderservice.repository.OrderRepository
 com.example.orderservice.domain.Order
 com.example.orderservice.application.OrderServiceApplication

 com.example.paymentservice.controller.PaymentController
 com.example.paymentservice.dto.PaymentResponseDto
 com.example.paymentservice.service.PaymentService
 com.example.paymentservice.repository.PaymentRepository
 com.example.paymentservice.domain.Payment
 com.example.paymentservice.application.PaymentServiceApplication'
           ,now()
           ,now());

INSERT INTO default_global_files (file_name, file_type, file_content, created_at, updated_at)
VALUES (
           '헥사고널 아키텍처',
           'ARCHITECTURE_DEFAULT_HEX',
           'com.example.userservice.application.UserServiceApplication
 com.example.userservice.domain.model.User
 com.example.userservice.domain.port.in.CreateUserUseCase
 com.example.userservice.domain.port.out.UserRepository
 com.example.userservice.service.UserService
 com.example.userservice.adapter.in.web.UserController
 com.example.userservice.adapter.out.persistence.JpaUserRepository

 com.example.orderservice.application.OrderServiceApplication
 com.example.orderservice.domain.model.Order
 com.example.orderservice.domain.port.in.CreateOrderUseCase
 com.example.orderservice.domain.port.out.OrderRepository
 com.example.orderservice.service.OrderService
 com.example.orderservice.adapter.in.web.OrderController
 com.example.orderservice.adapter.out.persistence.JpaOrderRepository

 com.example.paymentservice.application.PaymentServiceApplication
 com.example.paymentservice.domain.model.Payment
 com.example.paymentservice.domain.port.in.ProcessPaymentUseCase
 com.example.paymentservice.domain.port.out.PaymentRepository
 com.example.paymentservice.service.PaymentService
 com.example.paymentservice.adapter.in.web.PaymentController
 com.example.paymentservice.adapter.out.persistence.JpaPaymentRepository

 com.example.notificationservice.application.NotificationServiceApplication
 com.example.notificationservice.domain.model.Notification
 com.example.notificationservice.domain.port.in.SendNotificationUseCase
 com.example.notificationservice.domain.port.out.NotificationRepository
 com.example.notificationservice.service.NotificationService
 com.example.notificationservice.adapter.in.web.NotificationController
 com.example.notificationservice.adapter.out.persistence.JpaNotificationRepository',
           now(),
           now()
       );

INSERT INTO default_global_files (file_name, file_type, file_content, created_at, updated_at)
VALUES (
           '레이어드 아키텍처 A',
           'ARCHITECTURE_DEFAULT_LAYERED_A',
           'com.example.app.user.controller.UserController
 com.example.app.user.service.UserService
 com.example.app.user.service.impl.UserServiceImpl
 com.example.app.user.repository.UserRepository
 com.example.app.user.dto.UserRequestDto
 com.example.app.user.dto.UserResponseDto
 com.example.app.user.domain.User
 com.example.app.user.config.UserConfig

 com.example.app.order.controller.OrderController
 com.example.app.order.service.OrderService
 com.example.app.order.service.impl.OrderServiceImpl
 com.example.app.order.repository.OrderRepository
 com.example.app.order.dto.OrderRequestDto
 com.example.app.order.dto.OrderResponseDto
 com.example.app.order.domain.Order
 com.example.app.order.config.OrderConfig',
           now(),
           now()
       );

INSERT INTO default_global_files (file_name, file_type, file_content, created_at, updated_at)
VALUES (
           '레이어드 아키텍처 B',
           'ARCHITECTURE_DEFAULT_LAYERED_B',
           'com.example.app.controller.UserController
 com.example.app.controller.OrderController

 com.example.app.service.UserService
 com.example.app.service.impl.UserServiceImpl
 com.example.app.service.OrderService
 com.example.app.service.impl.OrderServiceImpl

 com.example.app.repository.UserRepository
 com.example.app.repository.OrderRepository

 com.example.app.dto.UserRequestDto
 com.example.app.dto.UserResponseDto
 com.example.app.dto.OrderRequestDto
 com.example.app.dto.OrderResponseDto

 com.example.app.domain.User
 com.example.app.domain.Order

 com.example.app.config.WebConfig
 com.example.app.Application',
           now(),
           now()
       );

INSERT INTO default_global_files (file_name, file_type, file_content, created_at, updated_at)
VALUES (
           '클린 아키텍처',
           'ARCHITECTURE_DEFAULT_CLEAN',
           'com.example.app.domain.model.User
 com.example.app.domain.model.Order
 com.example.app.domain.service.UserDomainService
 com.example.app.domain.service.OrderDomainService

 com.example.app.application.port.in.CreateUserUseCase
 com.example.app.application.port.in.GetUserUseCase
 com.example.app.application.port.in.CreateOrderUseCase
 com.example.app.application.port.in.GetOrderUseCase

 com.example.app.application.port.out.LoadUserPort
 com.example.app.application.port.out.SaveUserPort
 com.example.app.application.port.out.LoadOrderPort
 com.example.app.application.port.out.SaveOrderPort

 com.example.app.application.service.UserService
 com.example.app.application.service.OrderService

 com.example.app.adapter.in.web.UserController
 com.example.app.adapter.in.web.OrderController
 com.example.app.adapter.in.web.dto.UserRequestDto
 com.example.app.adapter.in.web.dto.UserResponseDto
 com.example.app.adapter.in.web.dto.OrderRequestDto
 com.example.app.adapter.in.web.dto.OrderResponseDto

 com.example.app.adapter.out.persistence.UserRepository
 com.example.app.adapter.out.persistence.OrderRepository
 com.example.app.adapter.out.persistence.entity.UserEntity
 com.example.app.adapter.out.persistence.entity.OrderEntity
 com.example.app.adapter.out.persistence.mapper.UserMapper
 com.example.app.adapter.out.persistence.mapper.OrderMapper

 com.example.app.config.WebConfig
 com.example.app.Application',
           now(),
           now()
       );

INSERT INTO default_global_files (file_name, file_type, file_content, created_at, updated_at)
VALUES (
           '기본 컨벤션',
           'CONVENTION_DEFAULT',
           '임포트 순서
 Java/JDK 표준 라이브러리
 서드파티 라이브러리 (알파벳 순)
 프로젝트 내부 클래스 (알파벳 순)

 네이밍 컨벤션
 클래스: PascalCase (예: UserService)
 변수/메소드: camelCase (예: getUserById)
 상수: UPPER_SNAKE_CASE (예: MAX_LOGIN_ATTEMPTS)
 패키지: 소문자 (예: com.company.service)
 테스트 클래스: 테스트 대상 클래스 + Test (예: UserServiceTest)

 애노테이션
 클래스 레벨: @Entity, @Service, @Controller, @RestController, @Repository
 생성자: @Autowired (생략 가능), @RequiredArgsConstructor
 메소드: @GetMapping, @PostMapping, @Transactional
 필드: @Id, @Column, @ManyToOne, @OneToMany

 JPA 엔티티
 기본 생성자: protected 접근 레벨 사용
 필드: 모두 private 선언
 상태 변경: setter 대신 명확한 의미의 메소드 사용
 ID 필드: 클래스명 + id (예: userId)
 연관관계: 항상 주인을 명확히 설정하고 편의 메소드 구현

 리포지토리
 네이밍: Entity명 + Repository (예: UserRepository)
 메소드 이름: findBy, existsBy, countBy 등 규칙 준수
 쿼리 메소드: 메소드 이름 기반 또는 @Query 애노테이션 사용

 서비스
 트랜잭션: 기본 readOnly = true, 쓰기 작업에만 @Transactional
 의존성 주입: 생성자 주입 방식 사용
 예외 처리: 구체적인 예외 클래스와 의미 있는 메시지 사용
 비즈니스 로직: 도메인 모델에 최대한 위임

 컨트롤러
 엔드포인트 네이밍: 명사 복수형 사용 (예: /api/users)
 HTTP 메소드: 적절한 메소드 사용 (GET, POST, PUT, DELETE)
 응답 코드: 적절한 HTTP 상태 코드 반환
 입력 검증: @Valid 애노테이션과 검증 그룹 활용

 DTO
 네이밍: 용도 + Entity명 + DTO (예: CreateUserDto)
 검증: Bean Validation API 사용 (@NotNull, @Size 등)
 직렬화 제어: @JsonIgnore, @JsonProperty 활용

 문서화
 JavaDoc: 모든 공개 API에 사용
 주석: 복잡한 로직에만 필요한 경우 사용
 API 문서: Swagger/OpenAPI 사용

 테스트
 네이밍: given_when_then 또는 should_expectedBehavior_when_condition
 테스트 범위: 단위 테스트, 통합 테스트, E2E 테스트 구분
 독립성: 테스트 간 의존성 없이 독립적으로 실행 가능하게 구성

 예외 처리
 Custom 예외: 비즈니스 도메인에 맞는 예외 클래스 정의
 전역 예외 처리: @ControllerAdvice와 @ExceptionHandler 활용
 에러 응답: 일관된 에러 응답 형식 사용

 Lombok 사용
 권장: @Getter, @RequiredArgsConstructor, @Builder
 주의: @Data, @Setter 남용 지양
 생성자: @NoArgsConstructor(access = AccessLevel.PROTECTED)

 데이터베이스
 테이블명: 스네이크 케이스, 복수형 (예: user_profiles)
 컬럼명: 스네이크 케이스 (예: created_at)
 외래키: 테이블명_id 형식 (예: user_id)
 인덱스: 적절한 인덱스 설정 (특히 조회 조건)

 설정 파일
 프로파일: 환경별 설정 분리 (dev, prod, test)
 민감 정보: 환경 변수 또는 외부 설정 사용
 로깅: 적절한 로그 레벨 설정'
           ,now()
           ,now());

-- 트랜잭션 커밋
COMMIT;