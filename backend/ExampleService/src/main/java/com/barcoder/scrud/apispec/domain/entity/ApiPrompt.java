package com.barcoder.scrud.apispec.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import com.barcoder.scrud.global.config.generator.SnowflakeId;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "api_prompt")
@Builder
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class ApiPrompt extends BaseTimeEntity {

    @Id
    @SnowflakeId
    private Long apiPromptId;

    @Column(columnDefinition = "LONGTEXT")
    private String prompt;

    @Column(columnDefinition = "LONGTEXT")
    private String response;
}
