package com.barcoder.scrud.apispec.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("GET")
public class GetApiSpecVersion extends ApiSpecVersion {

	@Column(columnDefinition = "JSON")
	private String queryParameters;

	@Column(columnDefinition = "JSON")
	private String pathParameters;
}
