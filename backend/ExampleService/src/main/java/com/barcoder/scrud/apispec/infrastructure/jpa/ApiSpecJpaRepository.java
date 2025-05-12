package com.barcoder.scrud.apispec.infrastructure.jpa;

import com.barcoder.scrud.apispec.domain.entity.ApiSpec;
import com.barcoder.scrud.scrudproject.domain.entity.ScrudProject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApiSpecJpaRepository extends JpaRepository<ApiSpec, Long> {
	Optional<ApiSpec> findByScrudProjectAndApiSpecVersion_ApiSpecVersionId(ScrudProject scrudProject, Long apiSpecVersionId);

	Optional<ApiSpec> findByApiSpecVersion_ApiSpecVersionId(Long apiSpecVersionId);

	List<ApiSpec> findAllByScrudProject(ScrudProject scrudProject);
}
