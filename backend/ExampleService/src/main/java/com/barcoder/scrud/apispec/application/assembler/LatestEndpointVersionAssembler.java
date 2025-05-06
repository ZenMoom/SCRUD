package com.barcoder.scrud.apispec.application.assembler;

import com.barcoder.scrud.apispec.domain.entity.ApiSpecVersion;
import com.barcoder.scrud.apispec.domain.entity.LatestEndpointVersion;
import com.barcoder.scrud.scrudproject.domain.entity.ScrudProject;
import org.springframework.stereotype.Component;

@Component
public class LatestEndpointVersionAssembler {

	public LatestEndpointVersion toLatestEndpointVersionEntity(ScrudProject scrudProject, ApiSpecVersion apiSpecVersion, String endpoint) {
		return LatestEndpointVersion.builder()
				.scrudProject(scrudProject)
				.apiSpecVersion(apiSpecVersion)
				.endpoint(endpoint)
				.build();
	}

}
