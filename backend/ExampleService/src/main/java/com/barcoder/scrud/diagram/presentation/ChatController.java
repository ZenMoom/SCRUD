package com.barcoder.scrud.diagram.presentation;

import com.barcoder.scrud.api.ChatApi;
import com.barcoder.scrud.diagram.infrastructure.webclient.ChatWebClient;
import com.barcoder.scrud.model.ChatHistoryResponse;
import com.barcoder.scrud.model.SSEIdResponse;
import com.barcoder.scrud.model.UserChatRequest;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@RestController
@RequiredArgsConstructor
public class ChatController implements ChatApi {

    private final ChatWebClient chatWebClient;

    /**
     * GET /api/v1/sse/connect/{SSEId} : SSE 연결을 설정합니다. 서버와 클라이언트 간의 SSE 연결을 설정하여 실시간 이벤트 스트림을 수신할 수 있습니다.
     *
     * @param SSEId SSE Id 입니다 (required)
     * @return SseEmitter 객체 (실시간 이벤트 수신용) or 인증되지 않은 요청 (status code 401)
     */
    @Override
    public ResponseEntity<String> connectSSE(@PathVariable(name = "SSEId") String SSEId) {
        log.info("리다이렉트 요청 감지: /api/sse/stream/{} -> /api/v1/sse/stream/{}", SSEId, SSEId);
        URI redirectUri = URI.create("/api/v1/sse/stream/" + SSEId);
        return ResponseEntity.status(HttpStatus.TEMPORARY_REDIRECT)
                .location(redirectUri)
                .build();
    }

    /**
     * 실제 SSE 스트림을 설정합니다. OpenAPI 생성 인터페이스와 충돌하지 않도록 별도의 엔드포인트로 구현합니다.
     *
     * @param SSEId SSE ID
     * @return SseEmitter 객체
     */
    @GetMapping(value = "/api/v1/sse/stream/{SSEId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connectSseStream(@PathVariable(name = "SSEId") String SSEId) {
        log.info("Establishing SSE stream for streamId: {}", SSEId);
        return chatWebClient.connectSSE(SSEId);
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
        // RequestContextHolder를 사용하여 현재 요청에서 헤더 가져오기
        ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = requestAttributes.getRequest();

        // Authorization 헤더 가져오기
        String authorizationHeader = request.getHeader("Authorization");
        SSEIdResponse response = chatWebClient.promptChat(projectId, apiId, userChatRequest, authorizationHeader);
        return ResponseEntity.ok(response);
    }

    @ExceptionHandler(WebClientResponseException.class)
    public ResponseEntity<String> handleIllegalArgumentException(WebClientResponseException ex) {
        log.error("WebClient 에러: {}, 상태 코드: {}", ex.getMessage(), ex.getStatusCode());
        return ResponseEntity.status(ex.getStatusCode()).body(ex.getResponseBodyAsString());
    }
}
