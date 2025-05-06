package com.barcoder.scrud.apispec.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import com.barcoder.scrud.scrudproject.domain.entity.ScrudProject;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Table(name = "latest_endpoint_version")
@Entity
@Getter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class LatestEndpointVersion extends BaseTimeEntity {

	@Id
	@GeneratedValue
	private Long latestEndpointVersionId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "scrud_project_id")
	private ScrudProject scrudProject;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "api_spec_version_id")
	private ApiSpecVersion apiSpecVersion;

	@Column(columnDefinition = "VARCHAR(255)")
	private String endpoint;

	/**
	 * API 업데이트
	 */
	public void updateApiSpecVersion(ApiSpecVersion apiSpecVersion) {
		this.apiSpecVersion = apiSpecVersion;
	}
}
