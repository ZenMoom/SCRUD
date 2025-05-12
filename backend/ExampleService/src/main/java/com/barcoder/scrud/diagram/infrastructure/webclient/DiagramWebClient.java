package com.barcoder.scrud.diagram.infrastructure.webclient;

import com.barcoder.scrud.model.DiagramResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
@Transactional
public class DiagramWebClient {

    private final WebClient webClient;

    public DiagramResponse createDiagram(String projectId, String apiId) {
        return webClient.post()
                .uri("/api/v1/projects/{projectId}/apis/{apiId}/diagrams", projectId, apiId)
                .retrieve()
                .bodyToMono(DiagramResponse.class)
                .block();
    }

    public DiagramResponse getDiagram(String projectId, String apiId, String versionId) {
        return webClient.get()
                .uri("/api/v1/projects/{projectId}/apis/{apiId}/versions/{versionId}", projectId, apiId, versionId)
                .retrieve()
                .bodyToMono(DiagramResponse.class)
                .block();
    }
}