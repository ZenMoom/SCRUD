package com.barcoder.scrud.spec.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "spec_version")
@Getter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class SpecVersion extends BaseTimeEntity {

	@Id
	@GeneratedValue
	private Long SpecVersionId;

	@Column(nullable = false)
	private int openapiMajor;
	@Column(nullable = false)
	private int openapiMinor;
	@Column(nullable = false)
	private int openapiPatch;

	@Column(columnDefinition = "TEXT")
	private String description;
}
