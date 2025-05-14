package com.barcoder.scrud.apispec.presentation;


import com.barcoder.scrud.api.ScrudApiApi;
import com.barcoder.scrud.apispec.application.dto.in.UpdateApiSpecStatusIn;
import com.barcoder.scrud.apispec.application.service.ApiSpecService;
import com.barcoder.scrud.apispec.domain.enums.ApiSpecStatus;
import com.barcoder.scrud.model.ApiProcessStateRequest;
import com.barcoder.scrud.model.ApiProcessStateUpdatedResponse;
import com.barcoder.scrud.model.ApiSummaryPageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
public class ScrudApiController implements ScrudApiApi {

	private final ApiSpecService apiSpecService;
	private final ModelMapper modelMapper;



	/**
	 * PUT /api/v1/projects/{projectId}/apis/{apiId}/status : API 처리 상태를 변경합니다.
	 * API 처리 상태를 변경합니다.
	 *
	 * @param projectId              프로젝트 ID (required)
	 * @param apiId                  API ID (required)
	 * @param apiProcessStateRequest 처리상태 (required)
	 * @return ApiProcessStateUpdatedResponse 프롬프트 처리 결과 (status code 200)
	 */
	@Override
	public ResponseEntity<ApiProcessStateUpdatedResponse> changeApiProcessStatus(String projectId, String apiId, ApiProcessStateRequest apiProcessStateRequest) {

		// 1. 조건에 맞게 inDto를 생성
		UpdateApiSpecStatusIn inDto = UpdateApiSpecStatusIn.builder()
				.apiSpecId(Long.parseLong(apiId))
				.apiSpecStatus(modelMapper.map(apiProcessStateRequest.getStatus(), ApiSpecStatus.class))
				.build();

		// 2. status 변경
		apiSpecService.updateApiSpecStatus(inDto);

		// 3. 변경에 문제가 없으면 요청으로 들어온 status로 변경됨
		// 그대로 반환
		ApiProcessStateUpdatedResponse response = ApiProcessStateUpdatedResponse.builder()
				.status(apiProcessStateRequest.getStatus())
				.build();

		return ResponseEntity.ok(response);
	}

	/**
	 * GET /api/v1/projects/{projectId}/apis : API 상태(USER_COMPLETED, AI_GENERATED 등)에 대해 검색합니다.
	 * parameter에 API의 상태(AI_GENERATED 등) 을 검색할 수 있습니다.  수정된 날자순으로 정렬되어 출력됩니다.
	 *
	 * @param projectId 프로젝트 ID (required)
	 * @param include   포함 (optional)
	 * @return ApiSummaryPageResponse API 상태가 AI_VISUALIZED 인 목록 조회 성공 (status code 200)
	 */
	@Override
	public ResponseEntity<ApiSummaryPageResponse> searchApiStatus(String projectId, String include) {
		return null;
	}
}
