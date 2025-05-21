package com.barcoder.scrud.apispec.application.facade;

import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionListOut;
import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionOut;
import com.barcoder.scrud.apispec.application.service.ApiSpecService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ApiGetFacade {

    private final ApiSpecService apiSpecService;

    public ApiSpecVersionListOut getApiSpecVersionListByScrudProjectId(Long scrudProjectId, UUID userId) {

        // 1. api spec 최신 버전 조회
        List<ApiSpecVersionOut> outList = apiSpecService.getLatestApiSpecVersionListByScrudProjectId(scrudProjectId, userId);

        // 2. api spec 최신 버전 리스트를 api spec 버전 리스트로 변환
        return ApiSpecVersionListOut.builder()
                .content(outList)
                .build();
    }
}
