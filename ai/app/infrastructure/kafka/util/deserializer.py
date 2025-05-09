from pydantic import ValidationError

# 커스텀 역직렬화 함수
def pydantic_deserializer(model_class):
    def deserializer(value_bytes: bytes):
        if value_bytes is None:
            return None
        try:
            # 바이트 -> 문자열
            json_str = value_bytes.decode('utf-8')
            # 문자열 -> Pydantic 모델
            return model_class.model_validate_json(json_str)
        except ValidationError as e:
            print(f"Validation error: {e}")
            # 유효하지 않은 데이터 처리 방법 결정
            # 1. None 반환하여 메시지 무시
            # 2. 예외를 다시 발생시켜 컨슈머를 중단
            # 3. 오류 로그를 기록하고 원시 데이터 반환
            return None
        except Exception as e:
            print(f"Deserialization error: {e}")
            return None
    return deserializer