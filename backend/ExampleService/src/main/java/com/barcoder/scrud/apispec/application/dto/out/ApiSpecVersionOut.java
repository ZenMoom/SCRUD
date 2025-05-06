package com.barcoder.scrud.apispec.application.dto.out;

import com.barcoder.scrud.apispec.domain.enums.HttpMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class ApiSpecVersionOut {

	private Long apiSpecVersionId;
	private UUID userId;
	private String endpoint;
	private String apiGroup;
	private int version;
	private String summary;
	private String description;
	private String response;
	private HttpMethod httpMethod;
	private String requestBody;
	private String queryParameters;
	private String pathParameters;
}
