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

@Table(name = "request_rule")
@Entity
@Getter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class RequestRule extends BaseTimeEntity {

	@Id
	@GeneratedValue
	private Long requestRuleId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "operation_field_rule_id")
	private OperationFieldRule operationFieldRule;

	@Column(columnDefinition = "VARCHAR(50)", nullable = false)
	private String contentType;

	@Column(columnDefinition = "VARCHAR(50)", nullable = false)
	private String bodyType;

	private Boolean isRequired;

	private boolean supportsFile;

	private String allowedFields;
}
