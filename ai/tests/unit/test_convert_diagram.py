import pytest
from datetime import datetime
from unittest.mock import MagicMock

from app.api.dto.diagram_dto import DiagramResponse
from app.core.services.chat_service_facade import ChatService
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram


class TestConvertDiagramResponseToDiagram:
    """
    ChatService의 _convert_diagram_response_to_diagram 메서드 테스트 클래스
    """

    @pytest.fixture
    def chat_service(self):
        """
        테스트를 위한 ChatService 설정
        """
        return ChatService(model_name="test_model")

    @pytest.fixture
    def diagram_response_fixture(self):
        """
        테스트를 위한 DiagramResponse 객체 생성
        """
        # DiagramResponse 객체 생성
        now = datetime.now()
        
        return DiagramResponse(
            diagramId="test_diagram_id",
            components=[
                DiagramResponse.ComponentResponse(
                    componentId="comp_1",
                    type=DiagramResponse.ComponentResponse.ComponentTypeEnum.CLASS,
                    name="TestClass",
                    description="테스트 클래스입니다",
                    positionX=100.0,
                    positionY=200.0,
                    methods=[
                        DiagramResponse.ComponentResponse.Method(
                            methodId="method_1",
                            name="testMethod",
                            signature="public void testMethod()",
                            body="return null;",
                            description="테스트 메서드입니다"
                        )
                    ]
                )
            ],
            connections=[
                DiagramResponse.ConnectionResponse(
                    connectionId="conn_1",
                    sourceMethodId="method_1",
                    targetMethodId="method_2",
                    type=DiagramResponse.ConnectionResponse.MethodConnectionTypeEnum.SOLID
                )
            ],
            dto=[
                DiagramResponse.DtoModelResponse(
                    dtoId="dto_1",
                    name="TestDTO",
                    description="테스트 DTO 클래스",
                    body="public class TestDTO { private String name; }"
                )
            ],
            metadata=DiagramResponse.MetadataResponse(
                metadataId="meta_1",
                version=1,
                lastModified=now,
                name="Test Diagram",
                description="테스트 다이어그램"
            )
        )

    def test_convert_diagram_response_to_diagram(self, chat_service, diagram_response_fixture):
        """
        DiagramResponse 객체가 Diagram 모델로 올바르게 변환되는지 테스트
        """
        # 테스트 실행
        result = chat_service._convert_diagram_response_to_diagram(diagram_response_fixture)
        
        # 결과 검증
        assert isinstance(result, Diagram)
        assert result.diagramId == "test_diagram_id"
        
        # 컴포넌트 검증
        assert len(result.components) == 1
        assert result.components[0].componentId == "comp_1"
        assert result.components[0].name == "TestClass"
        assert result.components[0].description == "테스트 클래스입니다"
        assert result.components[0].positionX == 100.0
        assert result.components[0].positionY == 200.0
        
        # 메서드 검증
        assert len(result.components[0].methods) == 1
        assert result.components[0].methods[0].methodId == "method_1"
        assert result.components[0].methods[0].name == "testMethod"
        assert result.components[0].methods[0].signature == "public void testMethod()"
        assert result.components[0].methods[0].body == "return null;"
        
        # 연결 검증
        assert len(result.connections) == 1
        assert result.connections[0].connectionId == "conn_1"
        assert result.connections[0].sourceMethodId == "method_1"
        assert result.connections[0].targetMethodId == "method_2"
        
        # DTO 검증
        assert len(result.dto) == 1
        assert result.dto[0].dtoId == "dto_1"
        assert result.dto[0].name == "TestDTO"
        assert result.dto[0].description == "테스트 DTO 클래스"
        
        # 메타데이터 검증
        assert result.metadata.metadataId == "meta_1"
        assert result.metadata.version == 1
        assert result.metadata.name == "Test Diagram"
        assert result.metadata.description == "테스트 다이어그램"