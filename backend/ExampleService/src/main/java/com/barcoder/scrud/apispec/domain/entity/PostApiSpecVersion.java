package com.barcoder.scrud.apispec.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("POST")
public class PostApiSpecVersion extends ApiSpecVersion {

	// Request Body
	@Column(columnDefinition = "JSON")
	private String requestBody;

	@Column(columnDefinition = "JSON")
	private String queryParameters;

	@Column(columnDefinition = "JSON")
	private String pathParameters;
}
