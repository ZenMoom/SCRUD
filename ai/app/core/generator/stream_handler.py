import asyncio
import json

from langchain.callbacks.base import BaseCallbackHandler


class SSEStreamingHandler(BaseCallbackHandler):
    def __init__(self):
        self.queue = asyncio.Queue()

    def on_llm_new_token(self, token: str, **kwargs) -> None:
        """새 토큰이 생성될 때마다 호출됩니다."""
        self.queue.put_nowait(token)

    async def get_tokens(self):
        while True:
            token = await self.queue.get()
            if token is None:  # None은 스트림 종료를 의미
                break
            yield f"data: {json.dumps({'token': token})}\n\n"
        # 스트림 종료 알림
        yield f"data: {json.dumps({'done': True})}\n\n"
        yield f"event: close\ndata: closing\n\n"

streaming_handler = SSEStreamingHandler()