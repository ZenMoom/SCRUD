import asyncio
import json

from langchain.callbacks.base import BaseCallbackHandler


class SSEStreamingHandler(BaseCallbackHandler):
    def __init__(self, response_queue: asyncio.Queue):
        self.response_queue = response_queue
        print(f"[디버깅] 새 SSEStreamingHandler 인스턴스 생성")

    def on_llm_new_token(self, token: str, **kwargs) -> None:
        """새 토큰이 생성될 때마다 호출됩니다."""
        event = f"data: {json.dumps({'token': token})}\n\n"
        self.response_queue.put_nowait(event)

    async def on_llm_end(self, response, **kwargs) -> None:
        """LLM 출력이 완료될 때 호출됩니다."""
        print("[디버깅] LLM 처리 완료, 종료 이벤트 추가")
        # self.response_queue.put_nowait(f"data: {json.dumps({'done': True})}\n\n")
        # self.response_queue.put_nowait(f"event: close\ndata: closing\n\n")

    async def on_llm_error(self, error: BaseException, **kwargs) -> None:
        """LLM에서 오류가 발생했을 때 호출됩니다."""
        error_message = f"\n\n오류가 발생했습니다: {str(error)}"
        print(f"[디버깅] LLM 오류 발생: {error_message}")
        self.response_queue.put_nowait(f"data: {json.dumps({'error': error_message})}\n\n")
        self.response_queue.put_nowait(f"data: {json.dumps({'done': True})}\n\n")
        self.response_queue.put_nowait(f"event: close\ndata: closing\n\n")
