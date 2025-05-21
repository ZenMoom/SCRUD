package com.barcoder.scrud.apispec.infrastructure.webclient.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class ApiSpecGenerateRequest {

    private String requirements;
    private String erd;
    @JsonProperty("extra_info")
    private String extraInfo;
}
