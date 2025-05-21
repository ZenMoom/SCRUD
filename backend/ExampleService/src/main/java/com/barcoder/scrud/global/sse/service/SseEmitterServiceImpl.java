package com.barcoder.scrud.global.sse.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class SseEmitterServiceImpl implements SseEmitterService {

    // Timeout for SSE connections (1 hour)
    private static final long SSE_TIMEOUT = 3600000L;
    
    // Map to store active emitters by streamId
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    @Override
    public SseEmitter createEmitter(String streamId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        
        // Store the emitter
        emitters.put(streamId, emitter);
        
        // Remove the emitter when it completes or times out
        emitter.onCompletion(() -> {
            log.info("SSE connection completed for streamId: {}", streamId);
            emitters.remove(streamId);
        });
        
        emitter.onTimeout(() -> {
            log.info("SSE connection timed out for streamId: {}", streamId);
            emitters.remove(streamId);
        });
        
        emitter.onError(e -> {
            log.error("SSE connection error for streamId: {}", streamId, e);
            emitters.remove(streamId);
        });
        
        // Send initial connection established event
        try {
            emitter.send(SseEmitter.event()
                    .name("connect")
                    .data("Connection established"));
            log.info("SSE connection established for streamId: {}", streamId);
        } catch (IOException e) {
            log.error("Error sending initial SSE event for streamId: {}", streamId, e);
            emitters.remove(streamId);
        }
        
        return emitter;
    }

    @Override
    public boolean sendEvent(String streamId, String eventName, Object data) {
        SseEmitter emitter = emitters.get(streamId);
        
        if (emitter == null) {
            log.warn("No active SSE connection found for streamId: {}", streamId);
            return false;
        }
        
        try {
            emitter.send(SseEmitter.event()
                    .name(eventName)
                    .data(data));
            return true;
        } catch (IOException e) {
            log.error("Error sending SSE event for streamId: {}", streamId, e);
            completeEmitter(streamId);
            return false;
        }
    }

    @Override
    public void completeEmitter(String streamId) {
        SseEmitter emitter = emitters.get(streamId);
        
        if (emitter != null) {
            try {
                emitter.complete();
                log.info("SSE connection completed for streamId: {}", streamId);
            } catch (Exception e) {
                log.error("Error completing SSE connection for streamId: {}", streamId, e);
            } finally {
                emitters.remove(streamId);
            }
        }
    }
}