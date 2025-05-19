import asyncio
import json

from langchain.callbacks.base import BaseCallbackHandler


class SSEStreamingHandler(BaseCallbackHandler):
    def __init__(self, response_queue: asyncio.Queue):
        self.queue = response_queue
        self.buffer = ""  # 토큰 버퍼링
        self.in_message = False  # message 부분 처리 중인지 상태 추적
        self.message_content = ""  # 추출된 message 내용
        self.escape: bool = False
        print(f"[디버깅] 새 SSEStreamingHandler 인스턴스 생성")

    # def on_llm_new_token(self, token: str, **kwargs) -> None:
    #     """새 토큰이 생성될 때마다 호출됩니다."""
    #     event = f"data: {json.dumps({'token': token})}\n\n"
    #     self.queue.put_nowait(event)

    def on_llm_new_token(self, token: str, **kwargs) -> None:
        """새 토큰이 생성될 때마다 호출됩니다."""
        self.buffer += token

        # message 키 탐색
        if not self.in_message and '"message"' in self.buffer:
            msg_idx = self.buffer.find('"message"')
            colon_idx = self.buffer.find(':', msg_idx)
            if colon_idx != -1:
                quote_start_idx = self.buffer.find('"', colon_idx)
                if quote_start_idx != -1:
                    self.in_message = True
                    self.escape = False
                    self.buffer = self.buffer[quote_start_idx + 1:]
                    self.message_content = ""

        if self.in_message:
            i = 0
            new_text = ""  # 새로 들어온 증분 메시지

            while i < len(self.buffer):
                char = self.buffer[i]

                if self.escape:
                    self.message_content += char
                    new_text += char
                    self.escape = False
                elif char == '\\':
                    self.message_content += char
                    new_text += char
                    self.escape = True
                elif char == '"':
                    # event = f"data: {new_text}\n\n"
                    event = f"data: {json.dumps({'token': new_text})}\n\n"
                    self.queue.put_nowait(event)

                    self.in_message = False
                    self.message_content = ""
                    self.buffer = self.buffer[i + 1:]
                    return
                else:
                    self.message_content += char
                    new_text += char

                i += 1

            # 중간 메시지 전송 (이번 토큰에서 파싱된 새 텍스트만 전송)
            if new_text:
                # event = f"data: {new_text}\n\n"
                event = f"data: {json.dumps({'token': new_text})}\n\n"

                self.queue.put_nowait(event)
            self.buffer = ""

    # def on_llm_new_token(self, token: str, **kwargs) -> None:
    #     """새 토큰이 생성될 때마다 호출됩니다."""
    #     # 토큰을 버퍼에 추가
    #     self.buffer += token
    #     print(f"[디버깅] 토큰 추가: {token}")
    #
    #     # JSON의 시작 부분 확인
    #     if not self.in_message and '"message"' in self.buffer:
    #         # message 키 다음의 콜론과 따옴표 위치 찾기
    #         msg_idx = self.buffer.find('"message"')
    #         colon_idx = self.buffer.find(':', msg_idx)
    #         if colon_idx != -1:
    #             # 콜론 다음의 첫 따옴표 위치 찾기
    #             quote_start_idx = self.buffer.find('"', colon_idx)
    #             if quote_start_idx != -1:
    #                 # message 값 추출 시작
    #                 self.in_message = True
    #                 # 버퍼에서 message 값 앞부분까지 제거
    #                 self.buffer = self.buffer[quote_start_idx + 1:]
    #                 print(f"[디버깅] message 값 추출 시작")
    #
    #     # message 값 추출 중이면 계속 처리
    #     if self.in_message:
    #         # 닫는 따옴표 찾기
    #         quote_end_idx = self.buffer.find('"')
    #
    #         if quote_end_idx != -1:
    #             # 닫는 따옴표가 있으면 message 값의 끝
    #             self.message_content += self.buffer[:quote_end_idx]
    #             event = f"data: {self.message_content}\n\n"
    #             self.queue.put_nowait(event)
    #             print(f"[디버깅] 메시지 전체 전송: {self.message_content}")
    #
    #             # 상태 초기화
    #             self.in_message = False
    #             self.message_content = ""
    #             self.buffer = self.buffer[quote_end_idx + 1:]
    #         else:
    #             # 닫는 따옴표가 없으면 현재 버퍼 전체를 message 값의 일부로 추가
    #             self.message_content += self.buffer
    #             event = f"data: {self.buffer}\n\n"
    #             self.queue.put_nowait(event)
    #             print(f"[디버깅] 메시지 부분 전송: {self.buffer}")
    #             self.buffer = ""

    async def on_llm_end(self, response, **kwargs) -> None:
        """LLM 출력이 완료될 때 호출됩니다."""
        print("[디버깅] LLM 처리 완료, 종료 이벤트 추가")
        # self.response_queue.put_nowait(f"data: {json.dumps({'done': True})}\n\n")
        # self.response_queue.put_nowait(f"event: close\ndata: closing\n\n")

    async def on_llm_error(self, error: BaseException, **kwargs) -> None:
        """LLM에서 오류가 발생했을 때 호출됩니다."""
        error_message = f"\n\n오류가 발생했습니다: {str(error)}"
        print(f"[디버깅] LLM 오류 발생: {error_message}")
        self.queue.put_nowait(f"data: {json.dumps({'error': error_message})}\n\n")
        self.queue.put_nowait(f"data: {json.dumps({'done': True})}\n\n")
        self.queue.put_nowait(f"event: close\ndata: closing\n\n")
