package com.barcoder.scrud.diagram.presentation;

import com.barcoder.scrud.api.ComponentApi;
import com.barcoder.scrud.model.ComponentPositionUpdateRequest;
import com.barcoder.scrud.model.ComponentUpdatedResponse;
import org.springframework.http.ResponseEntity;

public class DiagramController implements ComponentApi {

    /**
     * PUT /api/v1/projects/{projectId}/apis/{apiId}/components/{componentId}/position : 컴포넌트의 위치를 업데이트합니다. 도식화에서 특정
     * 컴포넌트의 위치 좌표를 변경합니다.
     *
     * @param projectId                      프로젝트 ID (required)
     * @param apiId                          API ID (required)
     * @param componentId                    위치를 변경할 컴포넌트 ID (required)
     * @param componentPositionUpdateRequest (required)
     * @return ComponentUpdatedResponse 컴포넌트 위치 업데이트 성공 (status code 200) or 요청한 리소스를 찾을 수 없습니다. (status code 404)
     */
    @Override
    public ResponseEntity<ComponentUpdatedResponse> updateComponentPosition(String projectId, String apiId,
                                                                            String componentId,
                                                                            ComponentPositionUpdateRequest componentPositionUpdateRequest) {
        return null;
    }
}
