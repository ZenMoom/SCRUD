package com.barcoder.scrud.spec.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import com.barcoder.scrud.global.config.generator.SnowflakeId;
import com.barcoder.scrud.spec.domain.vo.ScrudVersion;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Table(name = "service_spec_version")
@Entity
@Getter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class ServiceSpecVersion extends BaseTimeEntity {

    @Id
    @SnowflakeId
    private Long serviceSpecVersionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spec_version_id")
    private SpecVersion specVersion;

    private ScrudVersion scrudVersion;

    @Column(columnDefinition = "VARCHAR(200)")
    private String status;
    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "serviceSpecVersion")
    private List<OperationFieldRule> operationFieldRules = new ArrayList<>();
}
