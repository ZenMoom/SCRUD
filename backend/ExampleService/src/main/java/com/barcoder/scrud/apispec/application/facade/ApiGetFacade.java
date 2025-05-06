package com.barcoder.scrud.apispec.application.facade;

import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionListOut;
import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionOut;
import com.barcoder.scrud.apispec.application.service.ApiSpecVersionService;
import com.barcoder.scrud.apispec.application.service.LatestEndpointVersionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ApiGetFacade {

	private final ApiSpecVersionService apiSpecVersionService;
	private final LatestEndpointVersionService latestEndpointVersionService;

	public ApiSpecVersionListOut getApiSpecVersionListByScrudProjectId(Long scrudProjectId) {

		// 1. api spec 최신 버전 조회
		List<ApiSpecVersionOut> outList = latestEndpointVersionService.getLatestApiSpecVersionListByScrudProjectId(scrudProjectId);

		// 2. api spec 최신 버전 리스트를 api spec 버전 리스트로 변환
		return ApiSpecVersionListOut.builder()
				.content(outList)
				.build();
	}
}
