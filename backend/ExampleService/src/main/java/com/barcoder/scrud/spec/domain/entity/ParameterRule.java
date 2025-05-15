package com.barcoder.scrud.spec.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import com.barcoder.scrud.global.config.generator.SnowflakeId;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Table(name = "parameter_rule")
@Entity
@Getter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class ParameterRule extends BaseTimeEntity {

    @Id
    @SnowflakeId
    private Long parameterRuleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_field_rule_id")
    private OperationFieldRule operationFieldRule;

    @Column(columnDefinition = "VARCHAR(20)", nullable = false)
    private String inType;

    @Column(columnDefinition = "VARCHAR(20)", nullable = false)
    private String dataType;

    private boolean supportsEnum;

    private boolean supportsArray;

    private Boolean isRequired;
}
