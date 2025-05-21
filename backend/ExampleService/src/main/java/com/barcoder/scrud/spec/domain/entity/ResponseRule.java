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

@Table(name = "response_rule")
@Entity
@Getter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class ResponseRule extends BaseTimeEntity {

    @Id
    @SnowflakeId
    private Long responseRuleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_field_rule_id")
    private OperationFieldRule operationFieldRule;

    @Column(columnDefinition = "VARCHAR(10)", nullable = false)
    private String statusCode;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "VARCHAR(50)")
    private String contentType;

    @Column(columnDefinition = "VARCHAR(50)")
    private String schemaType;

    @Column(columnDefinition = "VARCHAR(255)")
    private String refComponent;

    private Boolean isError;
}
