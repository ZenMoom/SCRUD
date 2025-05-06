package com.barcoder.scrud.apispec.application.service;

import com.barcoder.scrud.apispec.application.assembler.ApiSpecVersionAssembler;
import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionOut;
import com.barcoder.scrud.apispec.domain.entity.ApiSpecVersion;
import com.barcoder.scrud.apispec.domain.exception.ApiSpecVersionErrorStatus;
import com.barcoder.scrud.apispec.infrastructure.jpa.ApiSpecVersionJpaRepository;
import com.barcoder.scrud.global.common.exception.BaseException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class ApiSpecVersionService {

	private final ApiSpecVersionAssembler apiSpecVersionAssembler;
	private final ApiSpecVersionJpaRepository apiSpecVersionJpaRepository;

	private final ModelMapper modelMapper;

	/**
	 * API 스펙 버전 생성
	 *
	 * @param inDto API 스펙 버전 생성 요청 DTO
	 * @return API 스펙 버전 응답 DTO
	 */
	public ApiSpecVersionOut createApiSpecVersion(CreateApiSpecVersionIn inDto) {

		// 1. DTO -> Entity 변환
		ApiSpecVersion apiSpecVersion = apiSpecVersionAssembler.toApiSpecVersionEntity(inDto);

		// 2. Entity -> DB 저장
		apiSpecVersionJpaRepository.save(apiSpecVersion);

		return modelMapper.map(apiSpecVersion, ApiSpecVersionOut.class);
	}

	/**
	 * API 스펙 버전 단일 조회
	 *
	 * @param apiSpecVersionId API 스펙 버전 ID
	 * @return API 스펙버전 응답 DTO
	 */
	public ApiSpecVersionOut getApiSpecVersionById(Long apiSpecVersionId) {
		// 1. API 스펙 버전 ID로 DB 조회
		ApiSpecVersion apiSpecVersion = apiSpecVersionJpaRepository.findById(apiSpecVersionId)
				.orElseThrow(() -> new BaseException(ApiSpecVersionErrorStatus.API_SPEC_VERSION_NOT_FOUND));

		// 2. Entity -> DTO 변환
		return modelMapper.map(apiSpecVersion, ApiSpecVersionOut.class);
	}
}
