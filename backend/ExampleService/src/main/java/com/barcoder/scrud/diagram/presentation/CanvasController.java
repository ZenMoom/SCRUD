package com.barcoder.scrud.diagram.presentation;

import com.barcoder.scrud.api.CanvasApi;
import com.barcoder.scrud.diagram.infrastructure.webclient.DiagramWebClient;
import com.barcoder.scrud.model.ChatHistoryResponse;
import com.barcoder.scrud.model.DiagramResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Slf4j
@RestController
@RequiredArgsConstructor
public class CanvasController implements CanvasApi {

    private final DiagramWebClient diagramWebClient;

    /**
     * POST /api/v1/projects/{projectId}/apis/{apiId}/diagrams : API를 최초로 도식화 할 때 사용합니다. 도식화를 처음 실행할 때 사용하는 API 입니다.
     *
     * @param projectId 프로젝트 ID (required)
     * @param apiId     API ID (required)
     * @return DiagramResponse 성공적으로 도식화 데이터를 조회함 (status code 200)
     */
    @Override
    public ResponseEntity<DiagramResponse> createDiagram(String projectId, String apiId) {
        ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = requestAttributes.getRequest();

        // Authorization 헤더 가져오기
        String authorizationHeader = request.getHeader("Authorization");

        // 헤더를 웹 클라이언트에 전달
        DiagramResponse response = diagramWebClient.createDiagram(projectId, apiId, authorizationHeader);
        return ResponseEntity.ok(response);
    }
    /**
     * GET /api/v1/projects/{projectId}/apis/{apiId}/versions/{versionId} : 특정 버전의 도식화 데이터 조회 특정 프로젝트의 특정 API 버전에 대한 메서드
     * 도식화 데이터를 가져옵니다.
     *
     * @param projectId 프로젝트 ID (required)
     * @param apiId     API ID (required)
     * @param versionId 버전 ID (required)
     * @return DiagramResponse 성공적으로 도식화 데이터를 조회함 (status code 200) or 요청한 리소스를 찾을 수 없습니다. (status code 404)
     */
    @Override
    public ResponseEntity<DiagramResponse> getDiagram(String projectId, String apiId, String versionId) {
        DiagramResponse response = diagramWebClient.getDiagram(projectId, apiId, versionId);
        return ResponseEntity.ok(response);
    }

    @ExceptionHandler(WebClientResponseException.class)
    public ResponseEntity<String> handleIllegalArgumentException(WebClientResponseException ex) {
        log.error("WebClient 에러: {}, 상태 코드: {}", ex.getMessage(), ex.getStatusCode());
        return ResponseEntity.status(ex.getStatusCode()).body(ex.getResponseBodyAsString());
    }

}
