package com.barcoder.scrud.apispec.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("PUT")
public class PutApiSpecVersion extends ApiSpecVersion {

	// Request Body
	@Column(columnDefinition = "JSON")
	private String requestBody;

	@Column(columnDefinition = "JSON")
	private String pathParameters;
}
