package com.barcoder.scrud.apispec.application.assembler;

import com.barcoder.scrud.apispec.domain.entity.ApiSpecVersion;
import com.barcoder.scrud.apispec.domain.entity.LatestEndpointVersion;
import com.barcoder.scrud.scrudproject.domain.entity.ScrudProject;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LatestEndpointVersionAssembler {

	public LatestEndpointVersion toLatestEndpointVersionEntity(ScrudProject scrudProject, ApiSpecVersion apiSpecVersion, String endpoint) {
		return LatestEndpointVersion.builder()
				.scrudProject(scrudProject)
				.apiSpecVersion(apiSpecVersion)
				.endpoint(endpoint)
				.build();
	}

	public List<LatestEndpointVersion> toLatestEndpointVersionEntityList(ScrudProject scrudProject, List<ApiSpecVersion> apiSpecVersionList) {
		return apiSpecVersionList.stream()
				.map(apiSpecVersion -> LatestEndpointVersion.builder()
						.scrudProject(scrudProject)
						.apiSpecVersion(apiSpecVersion)
						.endpoint(apiSpecVersion.getEndpoint())
						.build())
				.toList();
	}
}
