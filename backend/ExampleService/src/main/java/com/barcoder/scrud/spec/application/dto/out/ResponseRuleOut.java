package com.barcoder.scrud.spec.application.dto.out;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class ResponseRuleOut {

	private Boolean isError;
	private String description;
	private String schemaType;
	private String statusCode;
	private String contentType;
	private String refComponent;
}