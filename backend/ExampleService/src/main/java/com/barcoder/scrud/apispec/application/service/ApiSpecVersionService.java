package com.barcoder.scrud.apispec.application.service;

import com.barcoder.scrud.apispec.application.assembler.ApiSpecVersionAssembler;
import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.in.UpdateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionOut;
import com.barcoder.scrud.apispec.domain.entity.ApiSpecVersion;
import com.barcoder.scrud.apispec.domain.exception.ApiSpecErrorStatus;
import com.barcoder.scrud.apispec.infrastructure.jpa.ApiSpecVersionJpaRepository;
import com.barcoder.scrud.global.common.exception.ExceptionHandler;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

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
	@Transactional(readOnly = true)
	public ApiSpecVersionOut getApiSpecVersionById(Long apiSpecVersionId, UUID userId) {

		// 1. API 스펙 버전 ID로 DB 조회
		ApiSpecVersion apiSpecVersion = apiSpecVersionJpaRepository.findById(apiSpecVersionId)
				.orElseThrow(() -> new ExceptionHandler(ApiSpecErrorStatus.API_SPEC_VERSION_NOT_FOUND));

		// 2. API 스펙 버전 소유자와 요청자 비교
		if (!apiSpecVersion.getUserId().equals(userId)) {
			throw new ExceptionHandler(ApiSpecErrorStatus.API_SPEC_VERSION_NOT_BELONG_TO_USER);
		}

		// 3. Entity -> DTO 변환
		return modelMapper.map(apiSpecVersion, ApiSpecVersionOut.class);
	}

	/**
	 * API 스펙 버전 수정
	 */
	public ApiSpecVersionOut updateApiSpecVersion(UpdateApiSpecVersionIn inDto) {

		// 1. entity 조회
		ApiSpecVersion apiSpecVersion = apiSpecVersionJpaRepository.findById(inDto.getApiSpecVersionId())
				.orElseThrow(() -> new ExceptionHandler(ApiSpecErrorStatus.API_SPEC_VERSION_NOT_FOUND));

		// 2. 본인 소유 여부 확인
		if (!apiSpecVersion.getUserId().equals(inDto.getUserId())) {
			throw new ExceptionHandler(ApiSpecErrorStatus.API_SPEC_VERSION_NOT_BELONG_TO_USER);
		}

		// 3. api 생성을 위한 dto 변환, 버전 업
		CreateApiSpecVersionIn createIn = modelMapper.map(inDto, CreateApiSpecVersionIn.class).toBuilder()
				.version(apiSpecVersion.getVersion() + 1)
				.build();

		// 4. 새로운 entity 생성
		return createApiSpecVersion(createIn);
	}

	/**
	 * API 스펙 버전 벌크 생성
	 * @param inDtoList
	 */
	public List<ApiSpecVersionOut> bulkCreateApiSpecVersion(Long scrudProjectId, List<CreateApiSpecVersionIn> inDtoList, UUID userId) {
		// 1. DTO -> Entity 변환
		List<ApiSpecVersion> apiSpecVersionList = apiSpecVersionAssembler.toApiSpecVersionEntityList(scrudProjectId, inDtoList, userId);

		// 2. Entity -> DB 저장
		List<ApiSpecVersion> apiSpecVersions = apiSpecVersionJpaRepository.saveAll(apiSpecVersionList);

		// 3. Entity -> DTO 변환
		return apiSpecVersions.stream()
				.map(apiSpecVersion -> modelMapper.map(apiSpecVersion, ApiSpecVersionOut.class).toBuilder()
						.userId(userId)
						.build())
				.toList();
	}
}
