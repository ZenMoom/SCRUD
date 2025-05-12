package com.barcoder.scrud.diagram.infrastructure.webclient;

import com.barcoder.scrud.model.ComponentPositionUpdateRequest;
import com.barcoder.scrud.model.ComponentUpdatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
@Transactional
public class ComponentWebClient {

    private final WebClient webClient;

    public ComponentUpdatedResponse updateComponentPosition(String projectId, String apiId, String componentId, ComponentPositionUpdateRequest request) {
        return webClient.put()
                .uri("/api/v1/projects/{projectId}/apis/{apiId}/components/{componentId}/position", projectId, apiId, componentId)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ComponentUpdatedResponse.class)
                .block();
    }
}