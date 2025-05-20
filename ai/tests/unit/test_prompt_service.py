import pytest
from datetime import datetime
from typing import List

from app.api.dto.diagram_dto import UserChatRequest, MethodPromptTagEnum, MethodPromptTargetEnum
from app.core.llm.prompt_service import convert_chat_payload
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram, Component, Method, Metadata, ComponentTypeEnum


class TestPromptService:
    """PromptService의 테스트 클래스"""
    
    # get_code_data 함수를 테스트 클래스 내에서 사용하기 위해 추출
    @staticmethod
    def get_code_data(latest_diagram: Diagram, user_chat_data: UserChatRequest) -> List:
        """메소드 ID 목록으로 코드 데이터 조회"""
        from app.infrastructure.mongodb.repository.model.diagram_model import Method
        target_method_details: List[Method] = []

        # targetMethods 리스트가 빈 배열이라면 모든 Method를 넣는다
        if not user_chat_data.targetMethods:
            for component in latest_diagram.components:
                for method in component.methods:
                    target_method_details.append(method)
            return [method.model_dump() for method in target_method_details]

        latest_diagram_components = latest_diagram.components

        for component in latest_diagram_components:
            for targetMethod in user_chat_data.targetMethods:
                target_method_id = targetMethod.get("methodId", "")
                if not target_method_id:
                    continue

                for method in component.methods:
                    if method.methodId == target_method_id:
                        target_method_details.append(method)
                        break

        return [method.model_dump() for method in target_method_details]

    @pytest.fixture
    def diagram_fixture(self):
        """테스트를 위한 Diagram 객체 생성"""
        now = datetime.now()
        
        # 다이어그램에 포함될 메소드 생성
        method1 = Method(
            methodId="method-id-1",
            name="getUserById",
            signature="public User getUserById(Long id)",
            body="return userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));",
            description="사용자 ID로 사용자 정보를 조회하는 메소드"
        )
        
        method2 = Method(
            methodId="method-id-2",
            name="createUser",
            signature="public User createUser(UserDto userDto)",
            body="User user = userDto.toEntity(); return userRepository.save(user);",
            description="사용자 정보를 생성하는 메소드"
        )
        
        # 다이어그램에 포함될 컴포넌트 생성
        component = Component(
            componentId="component-id-1",
            type=ComponentTypeEnum.CLASS,
            name="UserService",
            description="사용자 서비스 클래스",
            positionX=100.0,
            positionY=100.0,
            methods=[method1, method2]
        )
        
        # 메타데이터 생성
        metadata = Metadata(
            metadataId="metadata-id-1",
            version=1,
            lastModified=now,
            name="Test Diagram",
            description="테스트 다이어그램"
        )
        
        # 다이어그램 생성 및 반환
        return Diagram(
            diagramId="diagram-id-1",
            projectId="project-id-1",
            apiId="api-id-1",
            components=[component],
            connections=[],
            dto=[],
            metadata=metadata
        )

    def test_get_code_data_with_target_methods(self, diagram_fixture):
        """특정 메소드를 타겟으로 하는 get_code_data 테스트"""
        # 테스트를 위한 UserChatRequest 생성
        user_chat_request = UserChatRequest(
            tag=MethodPromptTagEnum.EXPLAIN,
            promptType=MethodPromptTargetEnum.BODY,
            message="getUserById 메소드를 설명해주세요",
            targetMethods=[{"methodId": "method-id-1"}]  # 특정 메소드만 타겟으로 지정
        )
        
        # get_code_data 함수 호출
        result = self.get_code_data(diagram_fixture, user_chat_request)
        
        # 결과 검증
        assert isinstance(result, List)
        assert len(result) == 1
        assert result[0]["methodId"] == "method-id-1"
        assert result[0]["name"] == "getUserById"
        assert "getUserById" in result[0]["signature"]
        assert "userRepository.findById" in result[0]["body"]

    def test_get_code_data_with_multiple_target_methods(self, diagram_fixture):
        """여러 메소드를 타겟으로 하는 get_code_data 테스트"""
        # 테스트를 위한 UserChatRequest 생성
        user_chat_request = UserChatRequest(
            tag=MethodPromptTagEnum.OPTIMIZE,
            promptType=MethodPromptTargetEnum.BODY,
            message="모든 메소드를 최적화해주세요",
            targetMethods=[
                {"methodId": "method-id-1"},
                {"methodId": "method-id-2"}
            ]  # 여러 메소드를 타겟으로 지정
        )
        
        # get_code_data 함수 호출
        result = self.get_code_data(diagram_fixture, user_chat_request)
        
        # 결과 검증
        assert isinstance(result, List)
        assert len(result) == 2
        
        # 메소드 ID를 기준으로 정렬
        result_sorted = sorted(result, key=lambda x: x["methodId"])
        
        # method-id-1 검증
        assert result_sorted[0]["methodId"] == "method-id-1"
        assert result_sorted[0]["name"] == "getUserById"
        
        # method-id-2 검증
        assert result_sorted[1]["methodId"] == "method-id-2"
        assert result_sorted[1]["name"] == "createUser"

    def test_get_code_data_with_empty_target_methods(self, diagram_fixture):
        """타겟 메소드가 비어있는 경우의 get_code_data 테스트"""
        # 테스트를 위한 UserChatRequest 생성
        user_chat_request = UserChatRequest(
            tag=MethodPromptTagEnum.EXPLAIN,
            promptType=MethodPromptTargetEnum.BODY,
            message="모든 메소드를 설명해주세요",
            targetMethods=[]  # 타겟 메소드를 지정하지 않음
        )
        
        # get_code_data 함수 호출
        result = self.get_code_data(diagram_fixture, user_chat_request)
        print(f"\n result -> {result}")
        # 결과 검증
        assert isinstance(result, List)
        assert len(result) == 2  # 다이어그램의 모든 메소드가 포함되어야 함
        
        # 메소드 ID를 추출하여 검증
        method_ids = [method["methodId"] for method in result]
        assert "method-id-1" in method_ids
        assert "method-id-2" in method_ids

    def test_get_code_data_with_invalid_target_method_id(self, diagram_fixture):
        """존재하지 않는 메소드 ID를 타겟으로 하는 get_code_data 테스트"""
        # 테스트를 위한 UserChatRequest 생성
        user_chat_request = UserChatRequest(
            tag=MethodPromptTagEnum.EXPLAIN,
            promptType=MethodPromptTargetEnum.BODY,
            message="메소드를 설명해주세요",
            targetMethods=[{"methodId": "non-existent-method-id"}]  # 존재하지 않는 메소드 ID
        )
        
        # get_code_data 함수 호출
        result = self.get_code_data(diagram_fixture, user_chat_request)
        
        # 결과 검증
        assert isinstance(result, List)
        assert len(result) == 0  # 존재하지 않는 메소드 ID이므로 결과가 비어있어야 함

    def test_get_code_data_with_missing_method_id_in_target(self, diagram_fixture):
        """타겟 메소드에 methodId가 없는 경우의 get_code_data 테스트"""
        # 테스트를 위한 UserChatRequest 생성
        user_chat_request = UserChatRequest(
            tag=MethodPromptTagEnum.EXPLAIN,
            promptType=MethodPromptTargetEnum.BODY,
            message="메소드를 설명해주세요",
            targetMethods=[{"someOtherKey": "value"}]  # methodId 키가 없음
        )
        
        # get_code_data 함수 호출
        result = self.get_code_data(diagram_fixture, user_chat_request)
        
        # 결과 검증
        assert isinstance(result, List)
        assert len(result) == 0  # methodId 키가 없으므로 결과가 비어있어야 함

    def test_convert_chat_payload(self, diagram_fixture):
        """convert_chat_payload 함수 테스트"""
        # 테스트를 위한 UserChatRequest 생성
        user_chat_request = UserChatRequest(
            tag=MethodPromptTagEnum.EXPLAIN,
            promptType=MethodPromptTargetEnum.BODY,
            message="getUserById 메소드를 설명해주세요",
            targetMethods=[{"methodId": "method-id-1"}]
        )
        
        # convert_chat_payload 함수 호출
        result = convert_chat_payload(user_chat_request, diagram_fixture, user_chat_request)
        
        # 결과 검증
        assert result.tag == MethodPromptTagEnum.EXPLAIN
        assert result.promptType == MethodPromptTargetEnum.BODY
        assert result.message == "getUserById 메소드를 설명해주세요"
        assert len(result.targetMethods) == 1
        
        # targetMethods는 list[dict] 형태이므로 내부 정보 확인
        method_data = result.targetMethods[0]
        assert method_data["methodId"] == "method-id-1"
        assert method_data["name"] == "getUserById"
        assert "getUserById" in method_data["signature"]