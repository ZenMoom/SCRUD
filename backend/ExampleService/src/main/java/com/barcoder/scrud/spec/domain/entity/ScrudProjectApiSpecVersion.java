package com.barcoder.scrud.spec.domain.entity;

import com.barcoder.scrud.apispec.domain.entity.ApiSpecVersion;
import com.barcoder.scrud.global.config.generator.SnowflakeId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class ScrudProjectApiSpecVersion {

    @Id
    @SnowflakeId
    private Long ScrudProjectApiSpecVersionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_spec_version_id")
    private ApiSpecVersion apiSpecVersion;

//	@ManyToOne(fetch = FetchType.LAZY)
//	@JoinColumn(name = "scrud_project_id")
//	private ScrudProject scrudProject;
}
