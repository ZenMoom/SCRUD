package com.barcoder.scrud.apispec.application.assembler;

import com.barcoder.scrud.apispec.domain.entity.ApiSpec;
import com.barcoder.scrud.apispec.domain.entity.ApiSpecVersion;
import com.barcoder.scrud.scrudproject.domain.entity.ScrudProject;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ApiSpecAssembler {

	public ApiSpec toApiSpecEntity(ScrudProject scrudProject, ApiSpecVersion apiSpecVersion, String endpoint) {
		return ApiSpec.builder()
				.scrudProject(scrudProject)
				.apiSpecVersion(apiSpecVersion)
				.endpoint(endpoint)
				.build();
	}

	public List<ApiSpec> toApiSpecEntityList(ScrudProject scrudProject, List<ApiSpecVersion> apiSpecVersionList) {
		return apiSpecVersionList.stream()
				.map(apiSpecVersion -> ApiSpec.builder()
						.scrudProject(scrudProject)
						.apiSpecVersion(apiSpecVersion)
						.endpoint(apiSpecVersion.getEndpoint())
						.build())
				.toList();
	}
}
