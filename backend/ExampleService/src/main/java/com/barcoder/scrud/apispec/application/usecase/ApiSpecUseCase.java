package com.barcoder.scrud.apispec.application.usecase;

import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;

import java.util.List;

public interface ApiSpecUseCase {
    void bulkCreateApiSpecVersion(Long scrudProjectId, List<CreateApiSpecVersionIn> inDtoList);
}
