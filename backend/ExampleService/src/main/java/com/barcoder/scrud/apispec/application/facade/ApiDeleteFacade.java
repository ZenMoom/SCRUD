package com.barcoder.scrud.apispec.application.facade;

import com.barcoder.scrud.apispec.application.service.ApiSpecVersionService;
import com.barcoder.scrud.apispec.application.service.LatestEndpointVersionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class ApiDeleteFacade {

	private final ApiSpecVersionService apiSpecVersionService;
	private final LatestEndpointVersionService latestEndpointVersionService;


	public void deleteApiSpecVersion(Long apiSpecVersionId) {

		// 1. 최신 API 스펙 버전 정보 삭제
		latestEndpointVersionService.deleteLatestEndpointVersion(apiSpecVersionId);
	}
}
