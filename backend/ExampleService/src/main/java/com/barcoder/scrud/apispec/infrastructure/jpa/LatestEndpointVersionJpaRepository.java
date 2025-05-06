package com.barcoder.scrud.apispec.infrastructure.jpa;

import com.barcoder.scrud.apispec.domain.entity.LatestEndpointVersion;
import com.barcoder.scrud.scrudproject.domain.entity.ScrudProject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LatestEndpointVersionJpaRepository extends JpaRepository<LatestEndpointVersion, Long> {
	Optional<LatestEndpointVersion> findByScrudProjectAndApiSpecVersion_ApiSpecVersionId(ScrudProject scrudProject, Long apiSpecVersionId);
}
