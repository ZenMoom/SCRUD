package com.barcoder.scrud.diagram.infrastructure.webclient;

import com.barcoder.scrud.global.sse.service.SseEmitterService;
import com.barcoder.scrud.model.ChatHistoryResponse;
import com.barcoder.scrud.model.SSEIdResponse;
import com.barcoder.scrud.model.UserChatRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ChatWebClient {

    private final WebClient webClient;
    private final SseEmitterService sseEmitterService;

    // Store active SSE connections from AI server
    private final ConcurrentHashMap<String, Boolean> activeConnections = new ConcurrentHashMap<>();

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

    /**
     * Connect to AI server's SSE endpoint and relay events to the client
     *
     * @param sseId Stream ID for the SSE connection
     * @return SseEmitter for the client
     */
    public SseEmitter connectSSE(String sseId) {
        // If we already have an active connection for this ID, we don't need to create a new one
        if (activeConnections.containsKey(sseId)) {
            log.info("Using existing SSE connection for streamId: {}", sseId);
            return sseEmitterService.createEmitter(sseId);
        }

        // Create an SseEmitter for the client
        SseEmitter emitter = sseEmitterService.createEmitter(sseId);

        // Connect to AI server's SSE endpoint
        log.info("Connecting to AI server SSE endpoint for streamId: {}", sseId);

        // Mark this connection as active
        activeConnections.put(sseId, true);

        // We need to use the non-blocking WebClient to connect to the server's SSE endpoint
        webClient.get()
                .uri("/api/v1/sse/connect/{sseId}", sseId)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .retrieve()
                .bodyToFlux(String.class)
                .doOnNext(event -> {
                    // Process and forward each event from AI server to the client
                    try {
                        log.debug("Received SSE event for streamId {}: {}", sseId, event);
                        sseEmitterService.sendEvent(sseId, "message", event);
                    } catch (Exception e) {
                        log.error("Error forwarding SSE event for streamId: {}", sseId, e);
                    }
                })
                .doOnComplete(() -> {
                    log.info("SSE connection completed for streamId: {}", sseId);
                    sseEmitterService.completeEmitter(sseId);
                    activeConnections.remove(sseId);
                })
                .doOnError(e -> {
                    log.error("Error in SSE connection for streamId: {}", sseId, e);
                    sseEmitterService.completeEmitter(sseId);
                    activeConnections.remove(sseId);
                })
                .subscribe(); // Start the connection asynchronously

        // Set up a callback for when the client disconnects
        emitter.onCompletion(() -> {
            log.info("Client disconnected for streamId: {}", sseId);
            activeConnections.remove(sseId);
        });

        emitter.onTimeout(() -> {
            log.info("Client connection timed out for streamId: {}", sseId);
            activeConnections.remove(sseId);
        });

        return emitter;
    }
}