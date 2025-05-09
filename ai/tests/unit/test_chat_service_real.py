import pytest
import json
from datetime import datetime

from app.core.services.chat_service import ChatService
from app.core.generator.model_generator import ModelGenerator
from app.infrastructure.mongodb.repository.mongo_mock_repository import MongoMockRepository
from app.infrastructure.mongodb.repository.mongo_repository import MongoRepository
from app.core.models.prompt_models import Diagram

@pytest.mark.real
class TestChatServiceWithRealLLM:
    """
    ChatService 클래스를 실제 LLM과 함께 테스트합니다.
    
    이 테스트는 실제 API 호출을 수행하므로 비용이 발생할 수 있습니다.
    이 테스트를 실행하려면 다음 명령어를 사용하세요:
    python run_tests.py -m real
    """
    
    @pytest.fixture
    def sample_openapi_spec(self):
        """테스트용 OpenAPI 명세를 반환하는 fixture"""
        return """
        openapi: 3.0.0
        info:
          title: User Management API
          version: 1.0.0
          description: API for managing users in the system
        paths:
          /users:
            get:
              summary: Get all users
              description: Retrieve a list of all users
              operationId: getAllUsers
              responses:
                '200':
                  description: Successful operation
                  content:
                    application/json:
                      schema:
                        type: array
                        items:
                          $ref: '#/components/schemas/User'
        components:
          schemas:
            User:
              type: object
              properties:
                id:
                  type: string
                  format: uuid
                name:
                  type: string
                email:
                  type: string
                  format: email
                createdAt:
                  type: string
                  format: date-time
              required:
                - id
                - name
                - email
        """
    
    @pytest.fixture
    def chat_service(self):
        """
        실제 LLM을 사용하는 ChatService 객체를 생성합니다.
        Mock 대신 실제 repository를 사용하지만 데이터베이스 저장은 시뮬레이션합니다.
        """
        model_generator = ModelGenerator()
        repository: MongoRepository = MongoMockRepository(Diagram)
        
        # 실제 API 호출을 위해 "anthropic" 모델 사용
        # 다른 모델을 테스트하려면 여기서 변경 ("openai" 또는 "ollama")
        model_name = "openai"
        
        return ChatService(
            model_name=model_name,
            model_generator=model_generator,
            repository=repository
        )
    
    def test_setup_llm_and_parser(self, chat_service):
        """
        실제 LLM 모델과 파서가 올바르게 설정되는지 테스트합니다.
        """
        # When
        llm, parser = chat_service.setup_llm_and_parser()
        
        # Then
        assert llm is not None
        assert parser is not None
        
        # 실제 LLM 모델이 생성되었는지 확인
        assert chat_service.llm is not None
        assert chat_service.parser is not None
    
    def test_generate_diagram_data(self, chat_service, sample_openapi_spec):
        """
        실제 LLM을 사용하여 OpenAPI 명세로부터 도식화 데이터를 생성하는 기능을 테스트합니다.
        """
        # When: 실제 LLM을 사용하여 도식화 데이터 생성
        diagram = chat_service.generate_diagram_data(sample_openapi_spec)
        
        # Then: 생성된 도식화 데이터 검증
        assert diagram is not None
        assert diagram.diagramId is not None
        assert len(diagram.components) > 0
        
        # 필요한 구성 요소가 있는지 확인
        has_user_controller = any(comp.name == "UserController" 
                                 or "UserController" in comp.name 
                                 or "User" in comp.name 
                                 for comp in diagram.components)
        assert has_user_controller, "UserController 관련 컴포넌트가 없습니다."
        
        # 컴포넌트에 메서드가 있는지 확인
        for component in diagram.components:
            assert len(component.methods) > 0, f"{component.name} 컴포넌트에 메서드가 없습니다."
        
        # 결과를 보기 쉽게 출력 (디버깅용)
        print("\n====== 생성된 도식화 데이터 ======")
        print(f"다이어그램 ID: {diagram.diagramId}")
        print(f"컴포넌트 수: {len(diagram.components)}")
        print(f"연결 수: {len(diagram.connections)}")
        print(f"DTO 수: {len(diagram.dto)}")
        
        for comp in diagram.components:
            print(f"\n컴포넌트: {comp.name} ({comp.type})")
            for method in comp.methods:
                print(f"  - 메서드: {method.name}")
                print(f"    시그니처: {method.signature}")
        
        # 저장을 위해 JSON으로 직렬화 가능한지 확인
        json_data = diagram.model_dump_json()
        assert json_data is not None
        
    def test_create_diagram_from_openapi_end_to_end(self, chat_service, sample_openapi_spec):
        """
        OpenAPI 명세에서 도식화 데이터 생성 및 저장까지의 전체 흐름을 테스트합니다.
        """
        # When: 전체 프로세스 실행
        diagram = chat_service.create_diagram_from_openapi(sample_openapi_spec)
        
        # Then: 결과 검증
        assert diagram is not None
        assert diagram.diagramId is not None
        assert len(diagram.components) > 0
        assert len(diagram.connections) >= 0
        
        # 저장소 호출 확인 (MongoMockRepository는 실제 저장하지 않음)
        assert chat_service.repository.stored_data is not None
        assert chat_service.repository.stored_data == diagram