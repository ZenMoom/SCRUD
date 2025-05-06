package com.barcoder.scrud.apispec.application.assembler;

import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import com.barcoder.scrud.apispec.domain.entity.ApiSpecVersion;
import com.barcoder.scrud.apispec.domain.entity.DeleteApiSpecVersion;
import com.barcoder.scrud.apispec.domain.entity.GetApiSpecVersion;
import com.barcoder.scrud.apispec.domain.entity.PatchApiSpecVersion;
import com.barcoder.scrud.apispec.domain.entity.PostApiSpecVersion;
import com.barcoder.scrud.apispec.domain.entity.PutApiSpecVersion;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ApiSpecVersionAssembler {


	public ApiSpecVersion toApiSpecVersionEntity(CreateApiSpecVersionIn inDto){

		// version
		int version = inDto.getVersion() != null ? inDto.getVersion() : 1;

		return switch (inDto.getHttpMethod()) {

			case GET -> GetApiSpecVersion.builder()
			.userId(inDto.getUserId())
					.endpoint(inDto.getEndpoint())
					.apiGroup(inDto.getApiGroup())
					.version(version)
					.summary(inDto.getSummary())
					.description(inDto.getDescription())
					.response(inDto.getResponse())
					.httpMethod(inDto.getHttpMethod())
					.queryParameters(inDto.getQueryParameters())
					.pathParameters(inDto.getPathParameters())
					.build();

			case POST -> PostApiSpecVersion.builder()
					.userId(inDto.getUserId())
					.endpoint(inDto.getEndpoint())
					.apiGroup(inDto.getApiGroup())
					.version(version)
					.summary(inDto.getSummary())
					.description(inDto.getDescription())
					.response(inDto.getResponse())
					.httpMethod(inDto.getHttpMethod())
					.requestBody(inDto.getRequestBody())
					.queryParameters(inDto.getQueryParameters())
					.pathParameters(inDto.getPathParameters())
					.build();

			case PUT -> PutApiSpecVersion.builder()
					.userId(inDto.getUserId())
					.endpoint(inDto.getEndpoint())
					.apiGroup(inDto.getApiGroup())
					.version(version)
					.summary(inDto.getSummary())
					.description(inDto.getDescription())
					.response(inDto.getResponse())
					.httpMethod(inDto.getHttpMethod())
					.requestBody(inDto.getRequestBody())
					.pathParameters(inDto.getPathParameters())
					.build();

			case PATCH -> PatchApiSpecVersion.builder()
					.userId(inDto.getUserId())
					.endpoint(inDto.getEndpoint())
					.apiGroup(inDto.getApiGroup())
					.version(version)
					.summary(inDto.getSummary())
					.description(inDto.getDescription())
					.response(inDto.getResponse())
					.httpMethod(inDto.getHttpMethod())
					.requestBody(inDto.getRequestBody())
					.pathParameters(inDto.getPathParameters())
					.build();

			case DELETE -> DeleteApiSpecVersion.builder()
					.userId(inDto.getUserId())
					.endpoint(inDto.getEndpoint())
					.apiGroup(inDto.getApiGroup())
					.version(version)
					.summary(inDto.getSummary())
					.description(inDto.getDescription())
					.response(inDto.getResponse())
					.httpMethod(inDto.getHttpMethod())
					.pathParameters(inDto.getPathParameters())
					.build();
		};
	}

	public List<ApiSpecVersion> toApiSpecVersionEntityList(List<CreateApiSpecVersionIn> inDtoList) {
		return inDtoList.stream()
				.map(this::toApiSpecVersionEntity)
				.toList();
	}
}
