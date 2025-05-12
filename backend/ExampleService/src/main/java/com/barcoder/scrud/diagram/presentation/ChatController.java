package com.barcoder.scrud.diagram.presentation;

import com.barcoder.scrud.api.ChatApi;
import com.barcoder.scrud.diagram.infrastructure.webclient.ChatWebClient;
import com.barcoder.scrud.model.ChatHistoryResponse;
import com.barcoder.scrud.model.SSEIdResponse;
import com.barcoder.scrud.model.UserChatRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ChatController implements ChatApi {

    private final ChatWebClient chatWebClient;

    /**
     * GET /api/sse/connect/{SSEId} : SSE 연결을 설정합니다. 서버와 클라이언트 간의 SSE 연결을 설정하여 실시간 이벤트 스트림을 수신할 수 있습니다.
     *
     * @param ssEId SSE Id 입니다 (required)
     * @return String SSE 연결 성공 (status code 200) or 인증되지 않은 요청 (status code 401)
     */
    @Override
    public ResponseEntity<String> connectSSE(String ssEId) {
        String response = chatWebClient.connectSSE(ssEId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/projects/{projectId}/apis/{apiId}/chats : 프롬프트 채팅 기록 조회 특정 API에 대한 프롬프트 채팅 기록을 시간순으로 조회합니다.
     *
     * @param projectId 프로젝트 ID (required)
     * @param apiId     API ID (required)
     * @return ChatHistoryResponse 프롬프트 채팅 기록 조회 결과 (status code 200) or 요청한 리소스를 찾을 수 없습니다. (status code 404)
     */
    @Override
    public ResponseEntity<ChatHistoryResponse> getPrompts(String projectId, String apiId) {
        ChatHistoryResponse response = chatWebClient.getPrompts(projectId, apiId);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/projects/{projectId}/apis/{apiId}/chats : SSE 기반프롬프트 채팅 요청 프롬프트를 입력하여 도식화 수정을 요청하거나 설명을 요청합니다. 응답
     * 값으로 SSE Id를 받습니다. Id 값을 /api/sse/connect/{SSEId} API에 입력하여 값을 얻을 수 있습니다.
     *
     * @param projectId       프로젝트 ID (required)
     * @param apiId           API ID (required)
     * @param userChatRequest (required)
     * @return SSEIdResponse 프롬프트 처리 결과 (status code 200) or 요청한 리소스를 찾을 수 없습니다. (status code 404)
     */
    @Override
    public ResponseEntity<SSEIdResponse> promptChat(String projectId, String apiId, UserChatRequest userChatRequest) {
        SSEIdResponse response = chatWebClient.promptChat(projectId, apiId, userChatRequest);
        return ResponseEntity.ok(response);
    }
}
