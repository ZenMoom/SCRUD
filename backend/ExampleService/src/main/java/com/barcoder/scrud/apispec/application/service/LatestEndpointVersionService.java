package com.barcoder.scrud.apispec.application.service;

import com.barcoder.scrud.apispec.application.assembler.LatestEndpointVersionAssembler;
import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.in.UpdateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionOut;
import com.barcoder.scrud.apispec.domain.entity.ApiSpecVersion;
import com.barcoder.scrud.apispec.domain.entity.LatestEndpointVersion;
import com.barcoder.scrud.apispec.domain.exception.ApiSpecVersionErrorStatus;
import com.barcoder.scrud.apispec.infrastructure.jpa.ApiSpecVersionJpaRepository;
import com.barcoder.scrud.apispec.infrastructure.jpa.LatestEndpointVersionJpaRepository;
import com.barcoder.scrud.global.common.exception.BaseException;
import com.barcoder.scrud.scrudproject.domain.entity.ScrudProject;
import com.barcoder.scrud.scrudproject.repository.ScrudProjectRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class LatestEndpointVersionService {

	private final LatestEndpointVersionAssembler latestEndpointVersionAssembler;
	private final ScrudProjectRepository scrudProjectRepository;
	private final ApiSpecVersionJpaRepository apiSpecVersionJpaRepository;
	private final LatestEndpointVersionJpaRepository latestEndpointVersionJpaRepository;

	/**
	 * 최신 API 스펙 버전 생성
	 * @param inDto
	 * @param apiSpecVersionOut
	 */
	public void createLatestEndpointVersion(CreateApiSpecVersionIn inDto, ApiSpecVersionOut apiSpecVersionOut) {
		// 1. scrud project id 사용
		ScrudProject scrudProject = scrudProjectRepository.getReferenceById(inDto.getScrudProjectId());

		// 2. api spec version
		ApiSpecVersion apiSpecVersion = apiSpecVersionJpaRepository.getReferenceById(apiSpecVersionOut.getApiSpecVersionId());

		// 2. LatestEndpointVersion entity 생성
		LatestEndpointVersion latestEndpointVersion = latestEndpointVersionAssembler.toLatestEndpointVersionEntity(
				scrudProject,
				apiSpecVersion,
				inDto.getEndpoint()
		);

		// 3. LatestEndpointVersion entity DB 저장
		latestEndpointVersionJpaRepository.save(latestEndpointVersion);
	}

	/**
	 * 최신 API 스펙 버전 정보 업데이트
	 *
	 * @param inDto API 스펙 버전 수정 요청 DTO
	 * @param apiSpecVersionOut 최신 API 스펙 버전 응답 DTO
	 */
	public void updateLatestEndpointVersion(UpdateApiSpecVersionIn inDto, ApiSpecVersionOut apiSpecVersionOut) {

		// 1. scrud project id 사용
		ScrudProject scrudProject = scrudProjectRepository.getReferenceById(inDto.getScrudProjectId());

		// 2. LatestEndpointVersion entity 조회
		LatestEndpointVersion latestEndpointVersion = latestEndpointVersionJpaRepository.findByScrudProjectAndApiSpecVersion_ApiSpecVersionId(scrudProject, inDto.getApiSpecVersionId())
				.orElseThrow(() -> new BaseException(ApiSpecVersionErrorStatus.API_SPEC_VERSION_NOT_FOUND));

		// 3. 최신 버전 api 스펙 버전
		ApiSpecVersion apiSpecVersion = apiSpecVersionJpaRepository.getReferenceById(apiSpecVersionOut.getApiSpecVersionId());

		// 4. 최신 API 스펙 버전 정보 업데이트
		latestEndpointVersion.updateApiSpecVersion(apiSpecVersion);
	}

}
