package com.barcoder.scrud.apispec.domain.entity;

import com.barcoder.scrud.apispec.domain.enums.HttpMethod;
import com.barcoder.scrud.global.common.baseentity.SuperBuilderBaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "dtype")
@Getter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public abstract class ApiSpecVersion extends SuperBuilderBaseTimeEntity {

	@Id
	@GeneratedValue
	private Long apiSpecVersionId;

	private UUID userId;

	@Column(columnDefinition = "VARCHAR(255)", nullable = false)
	private String endpoint;

	@Column(columnDefinition = "VARCHAR(255)", nullable = false)
	private String apiGroup;

	@Column(nullable = false)
	private int version;

	@Column(columnDefinition = "VARCHAR(255)")
	private String summary;

	@Column(columnDefinition = "TEXT")
	private String description;

	private String response;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private HttpMethod httpMethod;
}
