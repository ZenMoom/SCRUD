package com.barcoder.scrud.global.sse.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Service for managing Server-Sent Events (SSE) connections
 */
public interface SseEmitterService {

    /**
     * Creates a new SSE emitter for a given stream ID
     * 
     * @param streamId The unique identifier for the SSE stream
     * @return SseEmitter instance for the client connection
     */
    SseEmitter createEmitter(String streamId);
    
    /**
     * Sends an event to a specific SSE stream
     * 
     * @param streamId The unique identifier for the SSE stream
     * @param eventName The name of the event
     * @param data The data to send with the event
     * @return true if the event was sent successfully, false otherwise
     */
    boolean sendEvent(String streamId, String eventName, Object data);
    
    /**
     * Completes (closes) an active SSE emitter
     * 
     * @param streamId The unique identifier for the SSE stream to complete
     */
    void completeEmitter(String streamId);
}