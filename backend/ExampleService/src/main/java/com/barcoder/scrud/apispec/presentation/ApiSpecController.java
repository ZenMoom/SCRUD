package com.barcoder.scrud.apispec.presentation;

import com.barcoder.scrud.api.ApiSpecApi;
import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.in.UpdateApiSpecStatusIn;
import com.barcoder.scrud.apispec.application.dto.in.UpdateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionListOut;
import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionOut;
import com.barcoder.scrud.apispec.application.facade.ApiCreateFacade;
import com.barcoder.scrud.apispec.application.facade.ApiDeleteFacade;
import com.barcoder.scrud.apispec.application.facade.ApiGetFacade;
import com.barcoder.scrud.apispec.application.facade.ApiUpdateFacade;
import com.barcoder.scrud.apispec.application.service.ApiSpecService;
import com.barcoder.scrud.apispec.application.service.ApiSpecVersionService;
import com.barcoder.scrud.model.ApiSpecListResponse;
import com.barcoder.scrud.model.ApiSpecVersionCreateRequest;
import com.barcoder.scrud.model.ApiSpecVersionCreatedResponse;
import com.barcoder.scrud.model.ApiSpecVersionResponse;
import com.barcoder.scrud.model.ApiSpecVersionStatusRequest;
import com.barcoder.scrud.model.ApiSpecVersionUpdateRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
public class ApiSpecController implements ApiSpecApi {

    private final ApiSpecVersionService apiSpecVersionService;
    private final ApiCreateFacade apiCreateFacade;
    private final ApiUpdateFacade apiUpdateFacade;
    private final ApiDeleteFacade apiDeleteFacade;
    private final ApiGetFacade apiGetFacade;
    private final ModelMapper modelMapper;
    private final ApiSpecService apiSpecService;

    /**
     * POST /api/v1/api-specs : API 스펙 생성
     * 새로운 API 스펙과 필드를 등록합니다.
     *
     * @param apiSpecVersionCreateRequest 단일 API 스펙과 필드를 전체 생성합니다. (required)
     * @return ApiSpecVersionCreatedResponse API 스펙 생성 성공 (status code 201)
     */
    @Override
    public ResponseEntity<ApiSpecVersionCreatedResponse> createApiSpec(ApiSpecVersionCreateRequest apiSpecVersionCreateRequest) {

        CreateApiSpecVersionIn inDto = modelMapper.map(apiSpecVersionCreateRequest, CreateApiSpecVersionIn.class);
        ApiSpecVersionOut outDto = apiCreateFacade.createApiSpecVersion(inDto);
        ApiSpecVersionCreatedResponse response = modelMapper.map(outDto, ApiSpecVersionCreatedResponse.class);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(response);
    }

    /**
     * GET /api/v1/api-specs/{apiSpecVersionId} : API 스펙 상세 조회
     * 단일 API 스펙과 관련 필드를 조회합니다.
     *
     * @param apiSpecVersionId (required)
     * @return ApiSpecWithFields 단일 API 스펙 조회 성공 (status code 200)
     */
    @Override
    public ResponseEntity<ApiSpecVersionResponse> getApiSpecById(Long apiSpecVersionId) {

        ApiSpecVersionOut apiSpecVersionById = apiSpecVersionService.getApiSpecVersionById(apiSpecVersionId);

        ApiSpecVersionResponse apiSpecWithFields = modelMapper.map(apiSpecVersionById, ApiSpecVersionResponse.class);

        return ResponseEntity.ok(apiSpecWithFields);
    }

    /**
     * PUT /api/v1/api-specs/{apiSpecVersionId} : API 스펙 수정
     * 단일 API 스펙과 필드를 전체 수정합니다.
     *
     * @param apiSpecVersionId            (required)
     * @param apiSpecVersionUpdateRequest 단일 API 스펙과 필드를 전체 생성합니다. (required)
     * @return ApiSpecVersionResponse API 스펙 수정 성공 (status code 200)
     */
    @Override
    public ResponseEntity<ApiSpecVersionResponse> updateApiSpec(Long apiSpecVersionId, ApiSpecVersionUpdateRequest apiSpecVersionUpdateRequest) {
        UpdateApiSpecVersionIn inDto = modelMapper.map(apiSpecVersionUpdateRequest, UpdateApiSpecVersionIn.class).toBuilder()
                .apiSpecVersionId(apiSpecVersionId)
                .build();

        ApiSpecVersionOut outDto = apiUpdateFacade.updateApiSpecVersion(inDto);

        ApiSpecVersionResponse response = modelMapper.map(outDto, ApiSpecVersionResponse.class);

        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/v1/api-specs/{apiSpecVersionId} : API 스펙 삭제
     * 단일 API 스펙과 관련 필드를 삭제합니다.
     *
     * @param apiSpecVersionId (required)
     * @return Void 성공적으로 처리되었습니다 (status code 204)
     */
    @Override
    public ResponseEntity<Void> deleteApiSpec(Long apiSpecVersionId) {
        apiDeleteFacade.deleteApiSpecVersion(apiSpecVersionId);
        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/v1/api-specs/by-project/{scrudProjectId} : Scrud 프로젝트 ID로 API 스펙 버전 목록 조회
     * 중간 매핑을 통해 ScrudProject ID로 연결된 모든 API 스펙 버전을 조회합니다.
     *
     * @param scrudProjectId Scrud 프로젝트 ID (required)
     * @return ApiSpecVersionListResponse API 스펙 목록 조회 성공 (status code 200)
     */
    @Override
    public ResponseEntity<ApiSpecListResponse> getApiSpecsByScrudProjectId(Long scrudProjectId) {

        ApiSpecVersionListOut outList = apiGetFacade.getApiSpecVersionListByScrudProjectId(scrudProjectId);

        ApiSpecListResponse response = modelMapper.map(outList, ApiSpecListResponse.class);
        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/v1/api-specs/api/{apiSpecId} : API 스펙 status 수정
     * API status 상태를 수정합니다.
     *
     * @param apiSpecId                   (required)
     * @param apiSpecVersionStatusRequest API 스펙 상태 변경 (required)
     * @return Void 성공적으로 처리되었습니다 (status code 200)
     */
    @Override
    public ResponseEntity<Void> updateApiSpecStatus(Long apiSpecId, ApiSpecVersionStatusRequest apiSpecVersionStatusRequest) {

        UpdateApiSpecStatusIn inDto = modelMapper.map(apiSpecVersionStatusRequest, UpdateApiSpecStatusIn.class).toBuilder()
                .apiSpecVersionId(apiSpecId)
                .build();

        apiSpecService.updateApiSpecStatus(inDto);
        return ResponseEntity.ok().build();
    }
}
