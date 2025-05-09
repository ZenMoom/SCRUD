package com.barcoder.scrud.apispec.infrastructure.webclient.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class ApiSpecGenerateResponse {

    private boolean success;
    private String prompt;
    private String result;
}
