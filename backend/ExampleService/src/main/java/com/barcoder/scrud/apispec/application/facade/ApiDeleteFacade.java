package com.barcoder.scrud.apispec.application.facade;

import com.barcoder.scrud.apispec.application.service.ApiSpecService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class ApiDeleteFacade {

    private final ApiSpecService apiSpecService;


    public void deleteApiSpecVersion(Long apiSpecVersionId, UUID userId) {

        // 1. 최신 API 스펙 버전 정보 삭제
        apiSpecService.deleteLatestEndpointVersion(apiSpecVersionId, userId);
    }
}
