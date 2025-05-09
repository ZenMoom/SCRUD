package com.barcoder.scrud.apispec.infrastructure.webclient;

import com.barcoder.scrud.apispec.infrastructure.webclient.request.ApiSpecGenerateRequest;
import com.barcoder.scrud.apispec.infrastructure.webclient.response.ApiSpecGenerateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
@Transactional
public class ApiSpecVersionWebclient {

    private final WebClient webClient;

    public ApiSpecGenerateResponse generateApiSpec(ApiSpecGenerateRequest request) {

        return webClient.post()
                .uri("/api/v1/generate")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ApiSpecGenerateResponse.class)
                .block();
    }
}
