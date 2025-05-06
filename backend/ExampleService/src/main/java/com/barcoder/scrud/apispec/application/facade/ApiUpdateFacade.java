package com.barcoder.scrud.apispec.application.facade;

import com.barcoder.scrud.apispec.application.dto.in.UpdateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionOut;
import com.barcoder.scrud.apispec.application.service.ApiSpecVersionService;
import com.barcoder.scrud.apispec.application.service.LatestEndpointVersionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class ApiUpdateFacade {

	private final ApiSpecVersionService apiSpecVersionService;
	private final LatestEndpointVersionService latestEndpointVersionService;

	public ApiSpecVersionOut updateApiSpecVersion(UpdateApiSpecVersionIn inDto) {

		// 1. 업데이트 된 API 스펙 버전 정보
		ApiSpecVersionOut apiSpecVersionOut = apiSpecVersionService.updateApiSpecVersion(inDto);

		// 2. 최신 API 스펙 버전 정보 업데이트
		latestEndpointVersionService.updateLatestEndpointVersion(inDto, apiSpecVersionOut);

		return apiSpecVersionOut;
	}
}
