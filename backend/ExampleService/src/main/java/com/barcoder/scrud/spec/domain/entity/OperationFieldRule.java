package com.barcoder.scrud.spec.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import io.swagger.v3.core.util.Json;
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

@Table(name = "operation_field_rule")
@Entity
@Getter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class OperationFieldRule extends BaseTimeEntity {

	@Id
	@GeneratedValue
	private Long operationFieldRuleId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "service_spec_version_id")
	private ServiceSpecVersion serviceSpecVersion;

	@Column(columnDefinition = "VARCHAR(50)", nullable = false)
	private String fieldName;

	@Builder.Default
	private Boolean isEditable = false;

	private String editableSubFields;
}
