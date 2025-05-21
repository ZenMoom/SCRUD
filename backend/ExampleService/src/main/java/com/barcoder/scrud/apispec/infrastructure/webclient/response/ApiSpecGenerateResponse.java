package com.barcoder.scrud.apispec.infrastructure.webclient.response;

import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class ApiSpecGenerateResponse {

    private boolean success;
    private String prompt;
    private List<CreateApiSpecVersionIn> result;
}
