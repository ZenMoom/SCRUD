package com.barcoder.scrud.apispec.application.facade;

import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionOut;
import com.barcoder.scrud.apispec.application.service.ApiSpecVersionService;
import com.barcoder.scrud.apispec.application.service.ApiSpecService;
import com.barcoder.scrud.apispec.application.usecase.ApiSpecUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ApiCreateFacade implements ApiSpecUseCase {

	private final ApiSpecVersionService apiSpecVersionService;
	private final ApiSpecService apiSpecService;

	public ApiSpecVersionOut createApiSpecVersion(CreateApiSpecVersionIn inDto) {

		// 1. API 스펙 버전 생성
		ApiSpecVersionOut apiSpecVersionOut = apiSpecVersionService.createApiSpecVersion(inDto);

		// 2. 최신 API 스펙 버전 생성
		apiSpecService.createLatestEndpointVersion(inDto, apiSpecVersionOut);

		return apiSpecVersionOut;
	}

	@Override
	public void bulkCreateApiSpecVersion(Long scrudProjectId, List<CreateApiSpecVersionIn> inDtoList) {

		// 1. API 스펙 버전 생성
		List<ApiSpecVersionOut> apiSpecVersionOuts = apiSpecVersionService.bulkCreateApiSpecVersion(scrudProjectId, inDtoList);

		// 2. 최신 API 스펙 버전 생성
		apiSpecService.bulkCreateLatestEndpointVersion(scrudProjectId, apiSpecVersionOuts);
	}
}
