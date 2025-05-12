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

-- 트랜잭션 커밋
COMMIT;