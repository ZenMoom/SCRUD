package com.barcoder.scrud.apispec.application.facade;

import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionOut;
import com.barcoder.scrud.apispec.application.service.ApiSpecVersionService;
import com.barcoder.scrud.apispec.application.service.LatestEndpointVersionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ApiCreateFacade {

	private final ApiSpecVersionService apiSpecVersionService;
	private final LatestEndpointVersionService latestEndpointVersionService;

	public ApiSpecVersionOut createApiSpecVersion(CreateApiSpecVersionIn inDto) {

		// 1. API 스펙 버전 생성
		ApiSpecVersionOut apiSpecVersionOut = apiSpecVersionService.createApiSpecVersion(inDto);

		// 2. 최신 API 스펙 버전 생성
		latestEndpointVersionService.createLatestEndpointVersion(inDto, apiSpecVersionOut);

		return apiSpecVersionOut;
	}

	public void bulkCreateApiSpecVersion(Long scrudProjectId, List<CreateApiSpecVersionIn> inDtoList) {

		// 1. API 스펙 버전 생성
		List<ApiSpecVersionOut> apiSpecVersionOuts = apiSpecVersionService.bulkCreateApiSpecVersion(inDtoList);

		// 2. 최신 API 스펙 버전 생성
		latestEndpointVersionService.bulkCreateLatestEndpointVersion(scrudProjectId, apiSpecVersionOuts);
	}
}
