package com.barcoder.scrud.apispec.application.facade;

import com.barcoder.scrud.apispec.application.dto.in.UpdateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionOut;
import com.barcoder.scrud.apispec.application.service.ApiSpecVersionService;
import com.barcoder.scrud.apispec.application.service.ApiSpecService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class ApiUpdateFacade {

	private final ApiSpecVersionService apiSpecVersionService;
	private final ApiSpecService apiSpecService;

	public ApiSpecVersionOut updateApiSpecVersion(UpdateApiSpecVersionIn inDto) {

		// 1. 업데이트 된 API 스펙 버전 정보
		ApiSpecVersionOut apiSpecVersionOut = apiSpecVersionService.updateApiSpecVersion(inDto);

		// 2. 최신 API 스펙 버전 정보 업데이트
		apiSpecService.updateLatestEndpointVersion(inDto, apiSpecVersionOut);

		return apiSpecVersionOut;
	}
}
