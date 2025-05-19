package com.barcoder.scrud.apispec.application.service;

import com.barcoder.scrud.apispec.application.assembler.ApiSpecAssembler;
import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.in.SearchApiStatusIn;
import com.barcoder.scrud.apispec.application.dto.in.UpdateApiSpecStatusIn;
import com.barcoder.scrud.apispec.application.dto.in.UpdateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionOut;
import com.barcoder.scrud.apispec.application.dto.out.SearchApiStatusOut;
import com.barcoder.scrud.apispec.domain.entity.ApiSpec;
import com.barcoder.scrud.apispec.domain.entity.ApiSpecVersion;
import com.barcoder.scrud.apispec.domain.exception.ApiSpecErrorStatus;
import com.barcoder.scrud.apispec.domain.query.in.SearchApiStatusQueryIn;
import com.barcoder.scrud.apispec.domain.query.out.SearchApiStatusQueryOut;
import com.barcoder.scrud.apispec.infrastructure.jpa.ApiSpecJpaRepository;
import com.barcoder.scrud.apispec.infrastructure.jpa.ApiSpecVersionJpaRepository;
import com.barcoder.scrud.apispec.infrastructure.querydsl.ApiSpecQueryDsl;
import com.barcoder.scrud.global.common.exception.ExceptionHandler;
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
public class ApiSpecService {

	private final ApiSpecAssembler apiSpecAssembler;
	private final ScrudProjectRepository scrudProjectRepository;
	private final ApiSpecVersionJpaRepository apiSpecVersionJpaRepository;
	private final ApiSpecJpaRepository apiSpecJpaRepository;
	private final ModelMapper modelMapper;
	private final ApiSpecQueryDsl apiSpecQuerydsl;

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
		ApiSpec apiSpec = apiSpecAssembler.toApiSpecEntity(
				scrudProject,
				apiSpecVersion,
				inDto.getEndpoint()
		);

		// 3. LatestEndpointVersion entity DB 저장
		apiSpecJpaRepository.save(apiSpec);
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
		ApiSpec apiSpec = apiSpecJpaRepository.findByScrudProjectAndApiSpecVersion_ApiSpecVersionId(scrudProject, inDto.getApiSpecVersionId())
				.orElseThrow(() -> new ExceptionHandler(ApiSpecErrorStatus.API_SPEC_VERSION_NOT_FOUND));

		// 3. 최신 버전 api 스펙 버전
		ApiSpecVersion apiSpecVersion = apiSpecVersionJpaRepository.getReferenceById(apiSpecVersionOut.getApiSpecVersionId());

		// 4. 최신 API 스펙 버전 정보 업데이트
		apiSpec.updateApiSpecVersion(apiSpecVersion);
	}

	/**
	 * 최신 API 스펙 버전 삭제
	 *
	 * @param apiSpecVersionId API 스펙 버전 ID
	 */
	public void deleteLatestEndpointVersion(Long apiSpecVersionId) {
		// 1. LatestEndpointVersion entity 조회
		ApiSpec apiSpec = apiSpecJpaRepository.findByApiSpecVersion_ApiSpecVersionId(apiSpecVersionId)
				.orElseThrow(() -> new ExceptionHandler(ApiSpecErrorStatus.API_SPEC_VERSION_NOT_FOUND));

		// 2. LatestEndpointVersion entity 삭제
		apiSpecJpaRepository.delete(apiSpec);
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
		List<ApiSpec> apiSpecList = apiSpecAssembler.toApiSpecEntityList(
				scrudProject,
				apiSpecVersions
		);

		// 5. LatestEndpointVersion entity DB 저장
		apiSpecJpaRepository.saveAll(apiSpecList);
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
		List<ApiSpec> apiSpecList = apiSpecJpaRepository.findAllByScrudProject(scrudProject);

		// LatestEndpointVersion entity가 존재하지 않는 경우
		if (apiSpecList.isEmpty()) {
			return List.of();
		}

		// 3. ApiSpecVersionOut 리스트 생성
		return convertToApiSpecVersionOut(apiSpecList);
	}

	/**
	 * ApiSpec entity 리스트를 ApiSpecVersionOut 리스트로 변환합니다.
	 *
	 * @param apiSpecList ApiSpec entity 리스트
	 * @return ApiSpecVersionOut 리스트
	 */
	private List<ApiSpecVersionOut> convertToApiSpecVersionOut(List<ApiSpec> apiSpecList) {
		return apiSpecList.stream()
				.map(apiSpec -> {
					ApiSpecVersionOut outDto = modelMapper.map(apiSpec.getApiSpecVersion(), ApiSpecVersionOut.class);
					return outDto.toBuilder()
							.apiSpecId(apiSpec.getApiSpecId())
							.apiSpecStatus(apiSpec.getApiSpecStatus())
							.build();
				})
				.toList();
	}

	/**
	 * api spec id로 entity를 조회하고, api spec status를 변경합니다.
	 *
	 * @param inDto the request DTO containing the API specification ID and the new status to be updated
	 */
	public void updateApiSpecStatus(UpdateApiSpecStatusIn inDto) {
		// 1. api spec id로 entity 조회
		ApiSpec apiSpec = apiSpecJpaRepository.findByApiSpecVersion_ApiSpecVersionId(inDto.getApiSpecVersionId())
				.orElseThrow(() -> new ExceptionHandler(ApiSpecErrorStatus.API_SPEC_NOT_FOUND));

		// 2. api spec status 변경
		apiSpec.updateApiSpecStatus(inDto.getApiSpecStatus());

	}

	/**
	 * api spec status로 검색합니다.
	 *
	 * @param inDto the request DTO containing the search criteria
	 */
	public SearchApiStatusOut searchApiStatus(SearchApiStatusIn inDto) {

		// 1. inQeury 생성
		SearchApiStatusQueryIn queryIn = modelMapper.map(inDto, SearchApiStatusQueryIn.class);

		// 2. api spec status로 검색
		SearchApiStatusQueryOut queryOut = apiSpecQuerydsl.searchApiStatus(queryIn);

		// 3. ApiSpecVersionOut 리스트 생성
		List<ApiSpecVersionOut> apiSpecVersionOutList = convertToApiSpecVersionOut(queryOut.getContent());

		// 3. api spec status로 검색한 결과를 outDto로 변환
		SearchApiStatusOut outDto = modelMapper.map(queryOut.getMetadata(), SearchApiStatusOut.class).toBuilder()
				.content(apiSpecVersionOutList)
				.build();

		// 4. 결과 반환
		return outDto;
	}
}
