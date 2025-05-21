package com.barcoder.scrud.spec.application.dto.out;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class ParameterRuleOut {

	private String inType;
	private String dataType;
	private Boolean isEditable;
	private Boolean isRequired;
	private Boolean supportsEnum;
	private Boolean supportsArray;
}