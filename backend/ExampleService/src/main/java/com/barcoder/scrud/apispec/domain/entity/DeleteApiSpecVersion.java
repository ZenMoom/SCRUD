package com.barcoder.scrud.apispec.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("DELETE")
public class DeleteApiSpecVersion extends ApiSpecVersion {

	@Column(columnDefinition = "JSON")
	private String pathParameters;
}
