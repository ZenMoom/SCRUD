package com.barcoder.scrud.apispec.domain.entity;

import com.barcoder.scrud.apispec.domain.enums.HttpMethod;
import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ApiSpecVersion extends BaseTimeEntity {

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

    @Column(columnDefinition = "TEXT")
    private String requestBody;

    @Column(columnDefinition = "TEXT")
    private String queryParameters;

    @Column(columnDefinition = "TEXT")
    private String pathParameters;

    @Column(columnDefinition = "TEXT")
    private String response;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HttpMethod httpMethod;
}
