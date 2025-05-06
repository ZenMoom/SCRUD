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
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class LatestEndpointVersionService {

	private final LatestEndpointVersionAssembler latestEndpointVersionAssembler;
	private final ScrudProjectRepository scrudProjectRepository;
	private final ApiSpecVersionJpaRepository apiSpecVersionJpaRepository;
	private final LatestEndpointVersionJpaRepository latestEndpointVersionJpaRepository;
	private final ModelMapper modelMapper;

	/**
	 * 최신 API 스펙 버전 생성
	 *
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
	 * @param inDto             API 스펙 버전 수정 요청 DTO
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

	/**
	 * 최신 API 스펙 버전 삭제
	 *
	 * @param apiSpecVersionId API 스펙 버전 ID
	 */
	public void deleteLatestEndpointVersion(Long apiSpecVersionId) {
		// 1. LatestEndpointVersion entity 조회
		LatestEndpointVersion latestEndpointVersion = latestEndpointVersionJpaRepository.findByApiSpecVersion_ApiSpecVersionId(apiSpecVersionId)
				.orElseThrow(() -> new BaseException(ApiSpecVersionErrorStatus.API_SPEC_VERSION_NOT_FOUND));

		// 2. LatestEndpointVersion entity 삭제
		latestEndpointVersionJpaRepository.delete(latestEndpointVersion);
	}

	/**
	 * 최신 API 스펙 버전 벌크 생성
	 *
	 * @param scrudProjectId
	 * @param apiSpecVersionOuts
	 */
	public void bulkCreateLatestEndpointVersion(Long scrudProjectId, List<ApiSpecVersionOut> apiSpecVersionOuts) {
		// 1. scrud project id 사용
		ScrudProject scrudProject = scrudProjectRepository.getReferenceById(scrudProjectId);

		// 2. ApiSpecVersion id 리스트
		List<Long> apiSpecVersionIds = apiSpecVersionOuts.stream()
				.map(ApiSpecVersionOut::getApiSpecVersionId)
				.toList();

		// 3. ApiSpecVersion entity 리스트
		List<ApiSpecVersion> apiSpecVersions = apiSpecVersionJpaRepository.findAllById(apiSpecVersionIds);

		// 4. LatestEndpointVersion entity 리스트 생성
		List<LatestEndpointVersion> latestEndpointVersionList = latestEndpointVersionAssembler.toLatestEndpointVersionEntityList(
				scrudProject,
				apiSpecVersions
		);

		// 5. LatestEndpointVersion entity DB 저장
		latestEndpointVersionJpaRepository.saveAll(latestEndpointVersionList);
	}

	/**
	 * 최신 API 스펙 버전 리스트 조회
	 *
	 * @param scrudProjectId Scrud 프로젝트 ID
	 * @return 최신 API 스펙 버전 리스트
	 */
	public List<ApiSpecVersionOut> getLatestApiSpecVersionListByScrudProjectId(Long scrudProjectId) {
		// 1. scrud project id 사용
		ScrudProject scrudProject = scrudProjectRepository.getReferenceById(scrudProjectId);

		// 2. LatestEndpointVersion entity 리스트 조회
		List<LatestEndpointVersion> latestEndpointVersionList = latestEndpointVersionJpaRepository.findAllByScrudProject(scrudProject);

		// LatestEndpointVersion entity가 존재하지 않는 경우
		if (latestEndpointVersionList.isEmpty()) {
			return List.of();
		}

		// 3. ApiSpecVersionOut 리스트 생성
		return latestEndpointVersionList.stream()
				.map(latestEndpointVersion -> modelMapper.map(latestEndpointVersion.getApiSpecVersion(), ApiSpecVersionOut.class))
				.toList();
	}
}
