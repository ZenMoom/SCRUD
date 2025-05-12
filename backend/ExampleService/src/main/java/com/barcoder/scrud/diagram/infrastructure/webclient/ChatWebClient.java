package com.barcoder.scrud.diagram.infrastructure.webclient;

import com.barcoder.scrud.model.ChatHistoryResponse;
import com.barcoder.scrud.model.SSEIdResponse;
import com.barcoder.scrud.model.UserChatRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatWebClient {

    private final WebClient webClient;

    public ChatHistoryResponse getPrompts(String projectId, String apiId) {
        return webClient.get()
                .uri("/api/v1/projects/{projectId}/apis/{apiId}/chats", projectId, apiId)
                .retrieve()
                .bodyToMono(ChatHistoryResponse.class)
                .block();
    }

    public SSEIdResponse promptChat(String projectId, String apiId, UserChatRequest userChatRequest) {
        return webClient.post()
                .uri("/api/v1/projects/{projectId}/apis/{apiId}/chats", projectId, apiId)
                .bodyValue(userChatRequest)
                .retrieve()
                .bodyToMono(SSEIdResponse.class)
                .block();
    }

    public String connectSSE(String sseId) {
        return webClient.get()
                .uri("/api/sse/connect/{sseId}", sseId)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }
}