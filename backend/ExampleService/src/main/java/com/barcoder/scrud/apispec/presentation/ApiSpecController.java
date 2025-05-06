package com.barcoder.scrud.apispec.presentation;

import com.barcoder.scrud.api.ApiSpecApi;
import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionOut;
import com.barcoder.scrud.apispec.application.facade.ApiCreateFacade;
import com.barcoder.scrud.apispec.application.service.ApiSpecVersionService;
import com.barcoder.scrud.model.ApiSpecVersionCreateRequest;
import com.barcoder.scrud.model.ApiSpecVersionCreatedResponse;
import com.barcoder.scrud.model.ApiSpecVersionResponse;
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
	private final ModelMapper modelMapper;

	/**
	 * POST /api/v1/api-specs : API 스펙 생성
	 * 새로운 API 스펙과 필드를 등록합니다.
	 *
	 * @param request 단일 API 스펙과 필드를 전체 생성합니다. (required)
	 * @return ApiSpecVersionCreatedResponse API 스펙 생성 성공 (status code 201)
	 */
	@Override
	public ResponseEntity<ApiSpecVersionCreatedResponse> createApiSpec(ApiSpecVersionCreateRequest request) {

		CreateApiSpecVersionIn inDto = modelMapper.map(request, CreateApiSpecVersionIn.class);
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
	 * @param apiSpecVersionCreateRequest 단일 API 스펙과 필드를 전체 생성합니다. (required)
	 * @return Boolean API 스펙 수정 성공 (status code 200)
	 */
	@Override
	public ResponseEntity<Boolean> updateApiSpec(Integer apiSpecVersionId, ApiSpecVersionCreateRequest apiSpecVersionCreateRequest) {
		return null;
	}
}
