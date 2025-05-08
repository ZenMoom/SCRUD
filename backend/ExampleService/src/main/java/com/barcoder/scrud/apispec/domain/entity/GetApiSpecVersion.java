package com.barcoder.scrud.apispec.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@DiscriminatorValue("GET")
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class GetApiSpecVersion extends ApiSpecVersion {

	@Column(columnDefinition = "TEXT")
	private String queryParameters;

	@Column(columnDefinition = "TEXT")
	private String pathParameters;
}
