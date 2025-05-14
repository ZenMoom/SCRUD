package com.barcoder.scrud.apispec.application.assembler;

import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import com.barcoder.scrud.apispec.domain.entity.ApiSpecVersion;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ApiSpecVersionAssembler {

    private final ModelMapper modelMapper;

    public ApiSpecVersion toApiSpecVersionEntity(CreateApiSpecVersionIn inDto) {

        // version
        int version = inDto.getVersion() != null ? inDto.getVersion() : 1;
        // apiGroup
        String[] segments = inDto.getEndpoint().split("/");
        String apiGroup = segments.length >= 4 ? segments[3] : "default";

        return ApiSpecVersion.builder()
                .userId(inDto.getUserId())
                .endpoint(inDto.getEndpoint())
                .apiGroup(apiGroup)
                .version(version)
                .summary(inDto.getSummary())
                .description(inDto.getDescription())
                .response(inDto.getResponse())
                .httpMethod(inDto.getHttpMethod())
                .queryParameters(inDto.getQueryParameters())
                .pathParameters(inDto.getPathParameters())
                .requestBody(inDto.getRequestBody())
                .build();
    }

    public List<ApiSpecVersion> toApiSpecVersionEntityList(Long scrudProjectId, List<CreateApiSpecVersionIn> inDtoList) {
        return inDtoList.stream()
                .map(createApiSpecVersionIn ->
                        toApiSpecVersionEntity(createApiSpecVersionIn.toBuilder()
                                .scrudProjectId(scrudProjectId)
                                .build())
                )
                .toList();
    }
}
