package com.barcoder.scrud.spec.application.dto.out;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class RequestRuleOut {

	private Boolean isRequired;
	private String bodyType;
	private String contentType;
	private Boolean supportsFile;
}