package com.barcoder.scrud.apispec.application.dto.in;

import com.barcoder.scrud.apispec.domain.enums.ApiSpecStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class UpdateApiSpecStatusIn {

    private Long apiSpecId;
    private ApiSpecStatus apiSpecStatus;

}
