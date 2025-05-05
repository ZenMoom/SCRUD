package com.barcoder.scrud.spec.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Table(name = "service_spec_version")
@Entity
@Getter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class ServiceSpecVersion extends BaseTimeEntity {

	@Id
	@GeneratedValue
	private Long serviceSpecVersionId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "spec_version_id")
	private SpecVersion specVersion;

	private int versionMajor;
	private int versionMinor;
	private int versionPatch;

	@Column(columnDefinition = "VARCHAR(200)")
	private String status;
	@Column(columnDefinition = "TEXT")
	private String description;
}
