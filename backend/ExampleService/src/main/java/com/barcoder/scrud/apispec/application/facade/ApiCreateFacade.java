package com.barcoder.scrud.apispec.application.facade;

import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionOut;
import com.barcoder.scrud.apispec.application.service.ApiSpecVersionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class ApiCreateFacade {

	private final ApiSpecVersionService apiSpecVersionService;

	// todo: 중간 테이블 추가
	public ApiSpecVersionOut createApiSpecVersion(CreateApiSpecVersionIn inDto) {

		return apiSpecVersionService.createApiSpecVersion(inDto);
	}
}
