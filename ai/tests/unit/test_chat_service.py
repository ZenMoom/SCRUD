import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

from app.core.services.chat_service import ChatService
from app.core.models.prompt_models import Diagram, Component, Method, Connection, DtoModel, Metadata, ComponentType, MethodConnectionType


class TestChatService:
    """ChatService 클래스 테스트"""
    
    @pytest.fixture
    def sample_openapi_spec(self):
        """테스트용 OpenAPI 명세를 반환하는 fixture"""
        return """
        openapi: 3.0.0
        info:
          title: Sample API
          version: 1.0.0
        paths:
          /users:
            get:
              summary: Get all users
              responses:
                '200':
                  description: Successful response
        """
    
    @pytest.fixture
    def sample_diagram(self):
        """테스트용 Diagram 객체를 반환하는 fixture"""
        return Diagram(
            diagramId="test123",
            components=[
                Component(
                    componentId="comp1",
                    type=ComponentType.CLASS,
                    name="UserController",
                    description="User management controller",
                    positionX=100.0,
                    positionY=200.0,
                    methods=[
                        Method(
                            methodId="method1",
                            name="getAllUsers",
                            signature="getAllUsers(): List<User>",
                            body="return userService.findAll();",
                            description="Get all users from the system"
                        )
                    ]
                )
            ],
            connections=[
                Connection(
                    connectionId="conn1",
                    sourceMethodId="method1",
                    targetMethodId="method2",
                    type=MethodConnectionType.SOLID
                )
            ],
            dto=[
                DtoModel(
                    dtoId="dto1",
                    name="UserDto",
                    description="User data transfer object",
                    body="class UserDto { String name; String email; }"
                )
            ],
            metadata=Metadata(
                metadataId="meta1",
                version="1.0",
                lastModified=datetime.now(),
                name="User Management API",
                description="API for managing users"
            )
        )
    
    @pytest.fixture
    def mock_model_generator(self):
        """ModelGenerator의 목(mock) 객체를 반환하는 fixture"""
        mock = Mock()
        mock.get_chat_model.return_value = Mock()
        return mock
    
    @pytest.fixture
    def mock_repository(self):
        """MongoRepositoryImpl의 목(mock) 객체를 반환하는 fixture"""
        mock = Mock()
        mock.insert_one.return_value = None
        return mock
    
    def test_init(self, mock_model_generator, mock_repository):
        """초기화 함수가 올바르게 동작하는지 테스트"""
        # Given
        model_name = "anthropic"
        
        # When
        service = ChatService(
            model_name=model_name,
            model_generator=mock_model_generator,
            repository=mock_repository
        )
        
        # Then
        assert service.model_name == model_name
        assert service.model_generator == mock_model_generator
        assert service.repository == mock_repository
        assert service.llm is None
        assert service.parser is None
    
    def test_setup_llm_and_parser(self, mock_model_generator, mock_repository):
        """LLM 및 파서 설정 메서드가 올바르게 동작하는지 테스트"""
        # Given
        model_name = "anthropic"
        mock_llm = Mock()
        mock_model_generator.get_chat_model.return_value = mock_llm
        
        service = ChatService(
            model_name=model_name,
            model_generator=mock_model_generator,
            repository=mock_repository
        )
        
        # When
        llm, parser = service.setup_llm_and_parser()
        
        # Then
        assert llm == mock_llm
        assert parser is not None
        mock_model_generator.get_chat_model.assert_called_once_with(model_name)
    
    @patch("app.core.services.chat_service.load_prompt")
    @patch("app.core.services.chat_service.PydanticOutputParser")
    @patch("app.core.services.chat_service.HumanMessage")
    def test_generate_diagram_data(self, mock_human_message, mock_parser_class, mock_load_prompt, 
                                   mock_model_generator, mock_repository, sample_openapi_spec, sample_diagram):
        """도식화 데이터 생성 메서드가 올바르게 동작하는지 테스트"""
        # Given
        model_name = "anthropic"
        mock_llm = Mock()
        mock_llm.invoke.return_value = Mock(content="diagram_json_data")
        
        mock_prompt = Mock()
        mock_load_prompt.return_value = mock_prompt
        mock_prompt.format.return_value = "formatted_prompt"
        
        mock_parser_instance = Mock()
        mock_parser_class.return_value = mock_parser_instance
        mock_parser_instance.get_format_instructions.return_value = "format_instructions"
        mock_parser_instance.parse.return_value = sample_diagram
        
        mock_model_generator.get_chat_model.return_value = mock_llm
        
        mock_human_message.side_effect = lambda content: MagicMock(content=content)
        
        service = ChatService(
            model_name=model_name,
            model_generator=mock_model_generator,
            repository=mock_repository
        )
        
        # When
        result = service.generate_diagram_data(sample_openapi_spec)
        
        # Then
        assert result == sample_diagram
        mock_model_generator.get_chat_model.assert_called_once()
        mock_llm.invoke.assert_called_once()
        mock_parser_instance.parse.assert_called_once_with("diagram_json_data")
    
    def test_create_diagram_from_openapi(self, mock_model_generator, mock_repository, 
                                        sample_openapi_spec, sample_diagram):
        """OpenAPI 명세로부터 도식화 데이터 생성 및 저장 메서드가 올바르게 동작하는지 테스트"""
        # Given
        model_name = "anthropic"
        
        service = ChatService(
            model_name=model_name,
            model_generator=mock_model_generator,
            repository=mock_repository
        )
        
        # Mock setup_llm_and_parser
        service.setup_llm_and_parser = Mock()
        
        # Mock generate_diagram_data
        service.generate_diagram_data = Mock(return_value=sample_diagram)
        
        # When
        result = service.create_diagram_from_openapi(sample_openapi_spec)
        
        # Then
        assert result == sample_diagram
        service.setup_llm_and_parser.assert_called_once()
        service.generate_diagram_data.assert_called_once_with(sample_openapi_spec)
        mock_repository.insert_one.assert_called_once_with(sample_diagram)